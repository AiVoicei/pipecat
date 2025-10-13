"""
Document parser for knowledge base files.

Supports: PDF, TXT, DOC, DOCX, MD files
Extracts text content for incorporation into agent system messages.
"""

from typing import Optional
import PyPDF2
import docx
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


class DocumentParser:
    """Parse various document formats for knowledge base"""

    # Maximum text length to prevent memory issues (100,000 characters)
    MAX_TEXT_LENGTH = 100_000

    async def parse_document(self, file_content: bytes, filename: str) -> str:
        """
        Parse document and extract text content.
        Supports: PDF, TXT, DOC, DOCX, MD

        Args:
            file_content: Raw file bytes
            filename: Original filename with extension

        Returns:
            Extracted text content (truncated if > MAX_TEXT_LENGTH)

        Raises:
            ValueError: If file type is unsupported or parsing fails
        """
        logger.info("Parsing document: %s (%d bytes)", filename, len(file_content))

        file_type = self._detect_file_type(file_content, filename)
        logger.debug("Detected file type: %s", file_type)

        try:
            if file_type == 'pdf':
                text = await self._parse_pdf(file_content)
            elif file_type in ['doc', 'docx']:
                text = await self._parse_docx(file_content)
            elif file_type in ['txt', 'md']:
                text = await self._parse_text(file_content)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")

            # Truncate if too long
            if len(text) > self.MAX_TEXT_LENGTH:
                logger.warning("Document exceeds max length (%d > %d), truncating",
                             len(text), self.MAX_TEXT_LENGTH)
                text = text[:self.MAX_TEXT_LENGTH] + "\n\n[Content truncated due to length]"

            logger.info("Successfully parsed document: %d characters", len(text))
            return text

        except Exception as e:
            logger.error("Failed to parse document %s: %s", filename, str(e))
            raise ValueError(f"Failed to parse document: {str(e)}")

    def _detect_file_type(self, content: bytes, filename: str) -> str:
        """
        Detect file type from content and extension.

        Args:
            content: File bytes
            filename: Original filename

        Returns:
            File type: 'pdf', 'doc', 'docx', 'txt', 'md'
        """
        extension = filename.lower().split('.')[-1] if '.' in filename else ''

        # Try extension first
        if extension in ['pdf', 'doc', 'docx', 'txt', 'md']:
            return extension

        # Fallback to magic number detection
        try:
            # PDF magic number
            if content.startswith(b'%PDF'):
                return 'pdf'

            # ZIP-based formats (docx)
            if content.startswith(b'PK\x03\x04'):
                return 'docx'

            # Old DOC format
            if content.startswith(b'\xd0\xcf\x11\xe0'):
                return 'doc'

            # Text formats
            try:
                content[:1000].decode('utf-8')
                return 'txt'
            except UnicodeDecodeError:
                pass

        except Exception as e:
            logger.warning("Magic number detection failed: %s", str(e))

        # Default to extension if available
        if extension:
            return extension

        raise ValueError("Unable to detect file type")

    async def _parse_pdf(self, content: bytes) -> str:
        """
        Parse PDF document.

        Args:
            content: PDF file bytes

        Returns:
            Extracted text
        """
        try:
            pdf_file = BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)

            text = []
            for i, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text.append(page_text)
                except Exception as e:
                    logger.warning("Failed to extract page %d: %s", i, str(e))
                    continue

            if not text:
                raise ValueError("No text content found in PDF")

            return "\n\n".join(text)

        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")

    async def _parse_docx(self, content: bytes) -> str:
        """
        Parse DOCX document.

        Args:
            content: DOCX file bytes

        Returns:
            Extracted text
        """
        try:
            doc_file = BytesIO(content)
            doc = docx.Document(doc_file)

            text = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text.append(paragraph.text)

            # Also extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            text.append(cell.text)

            if not text:
                raise ValueError("No text content found in document")

            return "\n\n".join(text)

        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")

    async def _parse_text(self, content: bytes) -> str:
        """
        Parse text document (TXT, MD).

        Args:
            content: Text file bytes

        Returns:
            Decoded text
        """
        # Try multiple encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-16']

        for encoding in encodings:
            try:
                text = content.decode(encoding)
                logger.debug("Successfully decoded as %s", encoding)
                return text
            except UnicodeDecodeError:
                continue

        raise ValueError("Failed to decode text file with any known encoding")

    def validate_file_size(self, file_size: int, max_size: int = 10 * 1024 * 1024) -> bool:
        """
        Validate file size.

        Args:
            file_size: File size in bytes
            max_size: Maximum allowed size (default: 10MB)

        Returns:
            True if valid, False otherwise
        """
        if file_size > max_size:
            logger.warning("File size %d exceeds max %d", file_size, max_size)
            return False
        return True

    def validate_file_type(self, filename: str) -> bool:
        """
        Validate file extension.

        Args:
            filename: File name with extension

        Returns:
            True if valid extension, False otherwise
        """
        extension = filename.lower().split('.')[-1] if '.' in filename else ''
        valid = extension in ['pdf', 'doc', 'docx', 'txt', 'md']

        if not valid:
            logger.warning("Invalid file extension: %s", extension)

        return valid


# Global instance
document_parser = DocumentParser()
