"""Test script for file upload functionality."""
import io
import sys
from pathlib import Path

from fastapi import UploadFile

from app.utils.file_upload import (
    validate_file_type,
    validate_file_size,
    generate_unique_filename,
    save_upload_file,
    delete_file,
    get_file_path,
    handle_transcript_upload,
    ensure_upload_dir,
)


async def create_test_pdf() -> UploadFile:
    """Create a fake PDF file for testing."""
    content = b"%PDF-1.4\n%Test PDF content\n%%EOF"
    return UploadFile(
        filename="test_transcript.pdf",
        file=io.BytesIO(content),
        headers={"content-type": "application/pdf"}
    )


async def create_test_image() -> UploadFile:
    """Create a test PNG file (fake 1x1 PNG)."""
    # Minimal valid PNG file (1x1 pixel, transparent)
    png_data = (
        b'\x89PNG\r\n\x1a\n'  # PNG signature
        b'\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
        b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89'
        b'\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01'
        b'\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    
    return UploadFile(
        filename="test_image.png",
        file=io.BytesIO(png_data),
        headers={"content-type": "image/png"}
    )


async def create_large_file() -> UploadFile:
    """Create a file larger than 5MB for testing size validation."""
    # Create a 6MB file
    content = b"x" * (6 * 1024 * 1024)
    return UploadFile(
        filename="large_file.pdf",
        file=io.BytesIO(content),
        headers={"content-type": "application/pdf"}
    )


async def create_invalid_file() -> UploadFile:
    """Create an invalid file type for testing."""
    content = b"Some text content"
    return UploadFile(
        filename="test.txt",
        file=io.BytesIO(content),
        headers={"content-type": "text/plain"}
    )


async def test_file_upload():
    """Test all file upload functionality."""
    print("=" * 70)
    print("FILE UPLOAD SERVICE TEST")
    print("=" * 70)
    
    # Test 1: Ensure upload directory
    print("\n--- TEST 1: Ensure Upload Directory ---")
    ensure_upload_dir()
    print("✅ Upload directory created/verified")
    
    # Test 2: Validate file type (valid)
    print("\n--- TEST 2: Validate File Type (Valid) ---")
    try:
        validate_file_type("test.pdf", "application/pdf")
        print("✅ PDF validation passed")
        
        validate_file_type("test.jpg", "image/jpeg")
        print("✅ JPG validation passed")
        
        validate_file_type("test.png", "image/png")
        print("✅ PNG validation passed")
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return False
    
    # Test 3: Validate file type (invalid)
    print("\n--- TEST 3: Validate File Type (Invalid) ---")
    try:
        validate_file_type("test.txt", "text/plain")
        print("❌ Should have rejected .txt file")
        return False
    except Exception as e:
        print(f"✅ Correctly rejected invalid file type: {str(e)[:50]}")
    
    # Test 4: Validate file size (valid)
    print("\n--- TEST 4: Validate File Size (Valid) ---")
    try:
        small_file = await create_test_pdf()
        await validate_file_size(small_file)
        print("✅ Small file size validation passed")
    except Exception as e:
        print(f"❌ Size validation failed: {e}")
        return False
    
    # Test 5: Validate file size (too large)
    print("\n--- TEST 5: Validate File Size (Too Large) ---")
    try:
        large_file = await create_large_file()
        await validate_file_size(large_file)
        print("❌ Should have rejected large file")
        return False
    except Exception as e:
        print(f"✅ Correctly rejected large file: {str(e)[:60]}...")
    
    # Test 6: Generate unique filename
    print("\n--- TEST 6: Generate Unique Filename ---")
    filename1 = generate_unique_filename("test.pdf")
    filename2 = generate_unique_filename("test.pdf")
    print(f"   - Generated filename 1: {filename1}")
    print(f"   - Generated filename 2: {filename2}")
    
    if filename1 != filename2:
        print("✅ Filenames are unique")
    else:
        print("❌ Filenames should be unique")
        return False
    
    if filename1.endswith(".pdf"):
        print("✅ Extension preserved")
    else:
        print("❌ Extension should be preserved")
        return False
    
    # Test 7: Save and retrieve file
    print("\n--- TEST 7: Save and Retrieve File ---")
    try:
        test_file = await create_test_pdf()
        saved_filename = await save_upload_file(test_file)
        print(f"✅ File saved: {saved_filename}")
        
        file_path = get_file_path(saved_filename)
        if file_path and file_path.exists():
            print(f"✅ File exists at: {file_path}")
            file_size = file_path.stat().st_size
            print(f"   - File size: {file_size} bytes")
        else:
            print("❌ File not found after save")
            return False
    except Exception as e:
        print(f"❌ Save failed: {e}")
        return False
    
    # Test 8: Handle complete upload (PDF)
    print("\n--- TEST 8: Handle Complete Upload (PDF) ---")
    try:
        test_file = await create_test_pdf()
        result = await handle_transcript_upload(test_file)
        
        print(f"✅ Upload handled successfully")
        print(f"   - Filename: {result['filename']}")
        print(f"   - URL: {result['url']}")
        print(f"   - Original: {result['original_filename']}")
        print(f"   - Type: {result['content_type']}")
        
        pdf_filename = result['filename']
    except Exception as e:
        print(f"❌ Upload handling failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 9: Handle complete upload (Image)
    print("\n--- TEST 9: Handle Complete Upload (PNG Image) ---")
    try:
        test_image = await create_test_image()
        result = await handle_transcript_upload(test_image)
        
        print(f"✅ Image upload handled successfully")
        print(f"   - Filename: {result['filename']}")
        print(f"   - URL: {result['url']}")
        
        image_filename = result['filename']
    except Exception as e:
        print(f"❌ Image upload failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 10: Reject invalid file type
    print("\n--- TEST 10: Reject Invalid File Type ---")
    try:
        invalid_file = await create_invalid_file()
        result = await handle_transcript_upload(invalid_file)
        print("❌ Should have rejected .txt file")
        return False
    except Exception as e:
        print(f"✅ Correctly rejected invalid file: {str(e)[:60]}...")
    
    # Test 11: Delete file
    print("\n--- TEST 11: Delete File ---")
    try:
        success = delete_file(saved_filename)
        if success:
            print(f"✅ File deleted: {saved_filename}")
        else:
            print("❌ File deletion returned False")
            return False
        
        # Verify file is gone
        file_path = get_file_path(saved_filename)
        if file_path is None:
            print("✅ File no longer exists")
        else:
            print("❌ File still exists after deletion")
            return False
    except Exception as e:
        print(f"❌ Deletion failed: {e}")
        return False
    
    # Test 12: Delete non-existent file
    print("\n--- TEST 12: Delete Non-Existent File ---")
    success = delete_file("nonexistent_file.pdf")
    if not success:
        print("✅ Correctly returned False for non-existent file")
    else:
        print("❌ Should return False for non-existent file")
        return False
    
    # Cleanup remaining test files
    print("\n--- Cleanup ---")
    try:
        delete_file(pdf_filename)
        delete_file(image_filename)
        print("✅ Test files cleaned up")
    except Exception as e:
        print(f"⚠️  Cleanup warning: {e}")
    
    print("\n" + "=" * 70)
    print("✅ ALL FILE UPLOAD TESTS PASSED!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    import asyncio
    
    try:
        success = asyncio.run(test_file_upload())
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test FAILED with error:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
