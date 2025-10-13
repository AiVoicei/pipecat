#
# Copyright (c) 2024–2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import asyncio
import os

from dotenv import load_dotenv
from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import (
    LLMMessagesAppendFrame,
    LLMRunFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.frameworks.rtvi import (
    ActionResult,
    RTVIAction,
    RTVIActionArgument,
    RTVIConfig,
    RTVIObserver,
    RTVIProcessor,
    RTVIServerMessageFrame,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import (
    create_transport,
    maybe_capture_participant_camera,
    maybe_capture_participant_screen,
)
from pipecat.services.gemini_multimodal_live.gemini import GeminiMultimodalLiveLLMService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

load_dotenv(override=True)

# Start with the WORKING Gemini Multimodal Live example (26c)
# and simply add RTVI for UI - minimal changes


def create_action_llm_append_to_messages(context_aggregator):
    async def action_llm_append_to_messages_handler(
        rtvi: RTVIProcessor, service: str, arguments: dict[str, any]
    ) -> ActionResult:
        run_immediately = arguments["run_immediately"] if "run_immediately" in arguments else True

        if run_immediately:
            await rtvi.interrupt_bot()

            if "messages" in arguments and arguments["messages"]:
                frame = LLMMessagesAppendFrame(messages=arguments["messages"])
                await rtvi.push_frame(frame)

        if run_immediately:
            frame = LLMRunFrame()
            await rtvi.push_frame(frame)

        return True

    return RTVIAction(
        service="llm",
        action="append_to_messages", 
        result="bool",
        arguments=[
            RTVIActionArgument(name="messages", type="array"),
            RTVIActionArgument(name="run_immediately", type="bool"),
        ],
        handler=action_llm_append_to_messages_handler,
    )


transport_params = {
    "daily": lambda: DailyParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        video_in_enabled=True,
        vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.5)),
    ),
    "webrtc": lambda: TransportParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        video_in_enabled=True,
        vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.5)),
    ),
}


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    logger.info("Starting Gemini Multimodal Live with basic RTVI")

    # Gemini setup configured for English
    llm = GeminiMultimodalLiveLLMService(
        api_key=os.getenv("GOOGLE_API_KEY"),
        voice_id="Leda",  # Using Leda voice for English
        system_instruction="You are a helpful assistant that speaks English. Always respond in English and be friendly and helpful. Provide clear, concise, and accurate responses to user queries.",
        # inference_on_context_initialization=False,
    )

    # Context setup with English greeting
    context = OpenAILLMContext([
        {
            "role": "user",
            "content": "Say hello.",
        },
    ])
    context_aggregator = llm.create_context_aggregator(context)

    # Add minimal RTVI (only difference from 26c)
    action_llm_append_to_messages = create_action_llm_append_to_messages(context_aggregator)
    rtvi = RTVIProcessor(config=RTVIConfig(config=[]))
    rtvi.register_action(action_llm_append_to_messages)

    # Same pipeline as 26c but with RTVI inserted
    pipeline = Pipeline([
        transport.input(),
        rtvi,                       # Only addition - RTVI for UI
        context_aggregator.user(),
        llm,
        transport.output(),
        context_aggregator.assistant(),
    ])

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        idle_timeout_secs=runner_args.pipeline_idle_timeout_secs,
        observers=[RTVIObserver(rtvi)],  # Required for RTVI
    )

    # RTVI client ready handler (for UI configuration)
    @rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        logger.info("Client ready")
        await rtvi.set_bot_ready()

        # Configure UI to show conversation
        ui_config = {
            "show_text_container": True,
            "show_video_container": True,
            "show_debug_container": False,
        }

        rtvi_frame = RTVIServerMessageFrame(data=ui_config)
        await task.queue_frames([rtvi_frame])

    # Same client connected logic as 26c
    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected: {client}")

        await maybe_capture_participant_camera(transport, client, framerate=1)
        await maybe_capture_participant_screen(transport, client, framerate=1)

        await task.queue_frames([LLMRunFrame()])
        await asyncio.sleep(3)
        logger.debug("Unpausing audio and video")
        llm.set_audio_input_paused(False)
        llm.set_video_input_paused(False)

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected")
        await task.cancel()

    runner = PipelineRunner(handle_sigint=runner_args.handle_sigint)
    await runner.run(task)


async def bot(runner_args: RunnerArguments):
    """Main bot entry point compatible with Pipecat Cloud."""
    transport = await create_transport(runner_args, transport_params)
    await run_bot(transport, runner_args)


if __name__ == "__main__":
    from pipecat.runner.run import main
    main()