"""
CAdesk Sensitive Data Log Redaction Filter
Automatically masks PAN and Aadhaar patterns across all logger records.
"""

import logging
import re

PAN_PATTERN = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b')
AADHAAR_PATTERN = re.compile(r'\b[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b')

class SensitiveDataRedactor(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.redact(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self.redact(v) if isinstance(v, str) else v for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple(self.redact(v) if isinstance(v, str) else v for v in record.args)
        return True

    @staticmethod
    def redact(text: str) -> str:
        def pan_sub(m):
            pan = m.group(0)
            return f"[PAN_REDACTED:{pan[-4:]}]"
        
        def aadhaar_sub(m):
            aadhaar = m.group(0).replace(" ", "")
            return f"[AADHAAR_REDACTED:{aadhaar[-4:]}]"
        
        redacted = PAN_PATTERN.sub(pan_sub, text)
        redacted = AADHAAR_PATTERN.sub(aadhaar_sub, redacted)
        return redacted

def sanitize_log_message(text: str) -> str:
    return SensitiveDataRedactor.redact(text)

def setup_redacted_logging():
    redactor = SensitiveDataRedactor()
    for handler in logging.root.handlers:
        handler.addFilter(redactor)
