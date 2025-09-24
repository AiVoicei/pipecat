"""
Provider Implementation Map

Maps all available Pipecat providers to their implementation status in Agenty.
This file serves as the definitive source for which providers are implemented,
partially implemented, or available in Pipecat but not yet integrated.
"""

from typing import Dict, List, Tuple, Any
from dataclasses import dataclass


@dataclass
class ProviderImplementationInfo:
    """Information about a provider's implementation status"""
    implemented: bool
    mock_fallback: bool
    pipecat_service_available: bool
    pipecat_import_path: str
    agenty_implementation_notes: str = ""
    priority: str = "medium"  # high, medium, low


# Provider Implementation Status Map
# Based on actual Pipecat services found in /src/pipecat/services/
PROVIDER_IMPLEMENTATIONS: Dict[str, ProviderImplementationInfo] = {

    # === STT Providers ===

    # Fully implemented STT providers
    "openai_stt": ProviderImplementationInfo(
        implemented=True,
        mock_fallback=False,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.openai.OpenAISTTService",
        agenty_implementation_notes="Fully implemented with Whisper models",
        priority="high"
    ),

    "deepgram": ProviderImplementationInfo(
        implemented=True,
        mock_fallback=False,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.deepgram.DeepgramSTTService",
        agenty_implementation_notes="Fully implemented with Nova models",
        priority="high"
    ),

    "azure_stt": ProviderImplementationInfo(
        implemented=True,
        mock_fallback=False,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.azure.AzureSTTService",
        agenty_implementation_notes="Fully implemented",
        priority="high"
    ),

    # Partially implemented STT providers (exist in Pipecat, need Agenty integration)
    "google_stt": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.google.GoogleSTTService",
        agenty_implementation_notes="Available in Pipecat, needs integration",
        priority="high"
    ),

    "assemblyai": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.assemblyai.AssemblyAISTTService",
        agenty_implementation_notes="Available in Pipecat, needs integration",
        priority="medium"
    ),

    "groq_stt": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.groq.GroqSTTService",
        agenty_implementation_notes="Ultra-fast Whisper, high value",
        priority="high"
    ),

    "aws_stt": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.aws.AWSSTTService",
        agenty_implementation_notes="AWS Transcribe, enterprise demand",
        priority="medium"
    ),

    "gladia": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.gladia.GladiaSTTService",
        agenty_implementation_notes="Multi-language + translation features",
        priority="medium"
    ),

    "speechmatics": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.speechmatics.SpeechmaticsSTTService",
        agenty_implementation_notes="Enterprise speech recognition",
        priority="medium"
    ),

    "soniox": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.soniox.SonioxSTTService",
        agenty_implementation_notes="High accuracy speech recognition",
        priority="low"
    ),

    "whisper_local": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.whisper.WhisperSTTService",
        agenty_implementation_notes="Local Whisper, privacy-focused users",
        priority="medium"
    ),

    "riva": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.riva.RivaSTTService",
        agenty_implementation_notes="NVIDIA Riva, on-premise enterprise",
        priority="low"
    ),

    "sambanova_stt": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.sambanova.SambaNovaSTTService",
        agenty_implementation_notes="Emerging provider",
        priority="low"
    ),

    "cartesia_stt": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.cartesia.CartesiaSTTService",
        agenty_implementation_notes="Real-time focused",
        priority="medium"
    ),

    "fal_stt": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.fal.FalSTTService",
        agenty_implementation_notes="Fast inference platform",
        priority="low"
    ),

    # === LLM Providers ===

    # Fully implemented LLM providers
    "openai_llm": ProviderImplementationInfo(
        implemented=True,
        mock_fallback=False,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.openai.OpenAILLMService",
        agenty_implementation_notes="Fully implemented with GPT models",
        priority="high"
    ),

    "anthropic": ProviderImplementationInfo(
        implemented=True,
        mock_fallback=False,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.anthropic.AnthropicLLMService",
        agenty_implementation_notes="Fully implemented with Claude models",
        priority="high"
    ),

    "azure_llm": ProviderImplementationInfo(
        implemented=True,
        mock_fallback=False,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.azure.AzureLLMService",
        agenty_implementation_notes="Fully implemented",
        priority="high"
    ),

    # Partially implemented LLM providers
    "google_llm": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.google.GoogleLLMService",
        agenty_implementation_notes="Gemini models, high demand",
        priority="high"
    ),

    "groq_llm": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.groq.GroqLLMService",
        agenty_implementation_notes="Ultra-fast inference, very popular",
        priority="high"
    ),

    "together": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.together.TogetherLLMService",
        agenty_implementation_notes="Open source models platform",
        priority="medium"
    ),

    "fireworks": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.fireworks.FireworksLLMService",
        agenty_implementation_notes="Fast inference for open models",
        priority="medium"
    ),

    "cerebras": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.cerebras.CerebrasLLMService",
        agenty_implementation_notes="Ultra-fast inference chip",
        priority="medium"
    ),

    "deepseek": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.deepseek.DeepSeekLLMService",
        agenty_implementation_notes="Chinese AI company models",
        priority="low"
    ),

    "perplexity": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.perplexity.PerplexityLLMService",
        agenty_implementation_notes="Search-enhanced models",
        priority="medium"
    ),

    "ollama": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.ollama.OllamaLLMService",
        agenty_implementation_notes="Local models, privacy-focused",
        priority="medium"
    ),

    "mistral": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.mistral.MistralLLMService",
        agenty_implementation_notes="European AI company",
        priority="medium"
    ),

    "qwen": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.qwen.QwenLLMService",
        agenty_implementation_notes="Alibaba's language models",
        priority="low"
    ),

    "grok": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.grok.GrokLLMService",
        agenty_implementation_notes="X.AI's language model",
        priority="low"
    ),

    "nim": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.nim.NimLLMService",
        agenty_implementation_notes="NVIDIA Inference Microservices",
        priority="low"
    ),

    "openrouter": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.openrouter.OpenRouterLLMService",
        agenty_implementation_notes="Multi-model API gateway",
        priority="medium"
    ),

    "openpipe": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.openpipe.OpenPipeLLMService",
        agenty_implementation_notes="Fine-tuning platform",
        priority="low"
    ),

    "aws_llm": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.aws.AWSLLMService",
        agenty_implementation_notes="AWS Bedrock models",
        priority="medium"
    ),

    "gemini_multimodal_live": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.gemini_multimodal_live.GeminiMultimodalLive",
        agenty_implementation_notes="Google's multimodal live API (current AI Voicei uses this)",
        priority="high"
    ),

    "aws_nova_sonic": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.aws_nova_sonic.AWSNovaSonicService",
        agenty_implementation_notes="AWS Nova Sonic multimodal",
        priority="medium"
    ),

    "sambanova_llm": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.sambanova.SambaNovaLLMService",
        agenty_implementation_notes="SambaNova language models",
        priority="low"
    ),

    # === TTS Providers ===

    # Fully implemented TTS providers
    "elevenlabs": ProviderImplementationInfo(
        implemented=True,
        mock_fallback=False,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.elevenlabs.ElevenLabsTTSService",
        agenty_implementation_notes="Fully implemented with voice cloning",
        priority="high"
    ),

    "cartesia": ProviderImplementationInfo(
        implemented=True,
        mock_fallback=False,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.cartesia.CartesiaTTSService",
        agenty_implementation_notes="Fully implemented, ultra-low latency",
        priority="high"
    ),

    "azure_tts": ProviderImplementationInfo(
        implemented=True,
        mock_fallback=False,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.azure.AzureTTSService",
        agenty_implementation_notes="Fully implemented",
        priority="high"
    ),

    # Partially implemented TTS providers
    "google_tts": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.google.GoogleTTSService",
        agenty_implementation_notes="High quality neural voices",
        priority="high"
    ),

    "aws_tts": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.aws.AWSTTSService",
        agenty_implementation_notes="AWS Polly, enterprise demand",
        priority="medium"
    ),

    "playht": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.playht.PlayHTTTSService",
        agenty_implementation_notes="Voice cloning and generation",
        priority="medium"
    ),

    "xtts": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.xtts.XTTSService",
        agenty_implementation_notes="Coqui XTTS, voice cloning",
        priority="medium"
    ),

    "neuphonic": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.neuphonic.NeurophonicTTSService",
        agenty_implementation_notes="Real-time TTS",
        priority="low"
    ),

    "rime": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.rime.RimeTTSService",
        agenty_implementation_notes="Emerging TTS provider",
        priority="low"
    ),

    "sarvam": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.sarvam.SarvamTTSService",
        agenty_implementation_notes="Indian languages focus",
        priority="low"
    ),

    "lmnt": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.lmnt.LMNTTTSService",
        agenty_implementation_notes="Fast speech synthesis",
        priority="low"
    ),

    "minimax": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.minimax.MinimaxTTSService",
        agenty_implementation_notes="Chinese TTS provider",
        priority="low"
    ),

    "fish": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.fish.FishTTSService",
        agenty_implementation_notes="Open source TTS",
        priority="low"
    ),

    "asyncai": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.asyncai.AsyncAITTSService",
        agenty_implementation_notes="Async-focused TTS",
        priority="low"
    ),

    "piper": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.piper.PiperTTSService",
        agenty_implementation_notes="Local TTS, privacy-focused",
        priority="medium"
    ),

    "inworld": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.inworld.InworldTTSService",
        agenty_implementation_notes="Gaming/character voices",
        priority="low"
    ),

    "riva_tts": ProviderImplementationInfo(
        implemented=False,
        mock_fallback=True,
        pipecat_service_available=True,
        pipecat_import_path="pipecat.services.riva.RivaTTSService",
        agenty_implementation_notes="NVIDIA Riva TTS",
        priority="low"
    ),
}


# Helper functions
def get_implemented_providers() -> List[str]:
    """Get list of fully implemented provider IDs"""
    return [pid for pid, info in PROVIDER_IMPLEMENTATIONS.items() if info.implemented]


def get_available_but_not_implemented() -> List[str]:
    """Get providers available in Pipecat but not yet implemented in Agenty"""
    return [
        pid for pid, info in PROVIDER_IMPLEMENTATIONS.items()
        if info.pipecat_service_available and not info.implemented
    ]


def get_high_priority_providers() -> List[str]:
    """Get high priority providers for implementation"""
    return [
        pid for pid, info in PROVIDER_IMPLEMENTATIONS.items()
        if info.priority == "high" and not info.implemented
    ]


def get_provider_count_by_type() -> Dict[str, Dict[str, int]]:
    """Get provider counts by type and status"""
    counts = {
        "stt": {"implemented": 0, "available": 0, "total": 0},
        "llm": {"implemented": 0, "available": 0, "total": 0},
        "tts": {"implemented": 0, "available": 0, "total": 0}
    }

    for provider_id, info in PROVIDER_IMPLEMENTATIONS.items():
        provider_type = None
        if "_stt" in provider_id or provider_id in ["deepgram", "assemblyai", "gladia", "speechmatics", "soniox", "whisper_local", "riva"]:
            provider_type = "stt"
        elif "_llm" in provider_id or provider_id in ["anthropic", "together", "fireworks", "cerebras", "deepseek", "perplexity", "ollama", "mistral", "qwen", "grok", "nim", "openrouter", "openpipe", "gemini_multimodal_live", "aws_nova_sonic"]:
            provider_type = "llm"
        elif "_tts" in provider_id or provider_id in ["elevenlabs", "cartesia", "playht", "xtts", "neuphonic", "rime", "sarvam", "lmnt", "minimax", "fish", "asyncai", "piper", "inworld"]:
            provider_type = "tts"

        if provider_type:
            counts[provider_type]["total"] += 1
            if info.pipecat_service_available:
                counts[provider_type]["available"] += 1
            if info.implemented:
                counts[provider_type]["implemented"] += 1

    return counts


def get_implementation_summary() -> Dict[str, Any]:
    """Get comprehensive implementation summary"""
    total_providers = len(PROVIDER_IMPLEMENTATIONS)
    implemented = len(get_implemented_providers())
    available = len([p for p in PROVIDER_IMPLEMENTATIONS.values() if p.pipecat_service_available])
    high_priority_pending = len(get_high_priority_providers())

    return {
        "total_providers": total_providers,
        "implemented": implemented,
        "available_in_pipecat": available,
        "implementation_percentage": round((implemented / total_providers) * 100, 1),
        "high_priority_pending": high_priority_pending,
        "by_type": get_provider_count_by_type(),
        "next_to_implement": get_high_priority_providers()[:5]  # Top 5 priorities
    }


# Export for use in other modules
__all__ = [
    "PROVIDER_IMPLEMENTATIONS",
    "ProviderImplementationInfo",
    "get_implemented_providers",
    "get_available_but_not_implemented",
    "get_high_priority_providers",
    "get_provider_count_by_type",
    "get_implementation_summary"
]