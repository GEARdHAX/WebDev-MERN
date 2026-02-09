import subprocess
import sys

# First install required packages
subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf2", "-q"])

from PyPDF2 import PdfReader

reader = PdfReader(r'd:\codes\MERN\Assignment Tasks\Alemeno\Backend Assignment.pdf')
text = ''
for page in reader.pages:
    text += page.extract_text() + '\n'
print(text)
