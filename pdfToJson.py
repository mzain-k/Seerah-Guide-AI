import fitz  # PyMuPDF
import json
import re

def extract_book_to_json(pdf_path, output_json_path):
    # Open the PDF file
    doc = fitz.open(pdf_path)
    book_dict = {}

    print(f"Processing {len(doc)} pages...")

    # Iterate through every page
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        # Extract raw text
        raw_text = page.get_text("text")
        
        # --- TEXT CLEANING ---
        # 1. Replace hard line breaks with a space to rejoin sentences
        clean_text = raw_text.replace("\n", " ")
        
        # 2. Remove multiple spaces (e.g., "The    Prophet" -> "The Prophet")
        clean_text = re.sub(r'\s+', ' ', clean_text)
        
        # 3. Strip leading/trailing whitespace
        clean_text = clean_text.strip()
        
        # PDF viewers are 1-based (Page 1, 2, 3) 
        # Python arrays are 0-based. We add 1 so the JSON key matches your PDF viewer exactly.
        viewer_page_number = str(page_num + 1)
        
        # Store in dictionary
        book_dict[viewer_page_number] = clean_text

    # Write to JSON file
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(book_dict, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully saved to {output_json_path}")

# Run the script
pdf_file = "book.pdf"
output_file = "seerah_pages.json"

extract_book_to_json(pdf_file, output_file)