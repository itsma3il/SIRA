"""Test script for file upload API endpoints."""
import io
import sys
from pathlib import Path

import httpx


BASE_URL = "http://localhost:8000"

# Mock JWT token for testing - replace with valid Clerk token in production
# For testing, we need to modify the security dependency
TEST_USER_ID = "test_user_123"


def create_test_pdf_bytes():
    """Create a fake PDF file as bytes."""
    return b"%PDF-1.4\n%Test PDF content for API test\n%%EOF"


def create_test_png_bytes():
    """Create a minimal valid PNG file."""
    return (
        b'\x89PNG\r\n\x1a\n'
        b'\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
        b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89'
        b'\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01'
        b'\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    )


def test_upload_api():
    """Test the file upload API endpoints."""
    print("=" * 70)
    print("FILE UPLOAD API TEST")
    print("=" * 70)
    print("\n⚠️  Note: This test requires authentication to be disabled")
    print("   or a valid Clerk token. Modify the API temporarily for testing.\n")
    
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        
        # Test 1: Health check
        print("--- TEST 1: Health Check ---")
        try:
            response = client.get("/health/live")
            if response.status_code == 200:
                print(f"✅ API is running: {response.json()}")
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to API: {e}")
            print("   Make sure the backend is running: docker-compose up -d")
            return False
        
        # Test 2: Upload PDF transcript
        print("\n--- TEST 2: Upload PDF Transcript ---")
        try:
            files = {
                "file": ("test_transcript.pdf", create_test_pdf_bytes(), "application/pdf")
            }
            
            response = client.post("/api/upload/transcript", files=files)
            
            if response.status_code == 401:
                print("⚠️  Authentication required (401)")
                print("   Response:", response.json())
                print("\n   To test properly:")
                print("   1. Get a valid Clerk JWT token")
                print("   2. Add header: Authorization: Bearer <token>")
                print("   OR temporarily disable auth in upload.py for testing")
                return False
            
            if response.status_code == 201:
                data = response.json()
                print("✅ PDF uploaded successfully:")
                print(f"   - Filename: {data['filename']}")
                print(f"   - URL: {data['url']}")
                print(f"   - Original: {data['original_filename']}")
                print(f"   - Type: {data['content_type']}")
                pdf_filename = data['filename']
            else:
                print(f"❌ Upload failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Upload error: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        # Test 3: Upload PNG image
        print("\n--- TEST 3: Upload PNG Image ---")
        try:
            files = {
                "file": ("test_image.png", create_test_png_bytes(), "image/png")
            }
            
            response = client.post("/api/upload/transcript", files=files)
            
            if response.status_code == 201:
                data = response.json()
                print("✅ PNG uploaded successfully:")
                print(f"   - Filename: {data['filename']}")
                print(f"   - URL: {data['url']}")
                png_filename = data['filename']
            else:
                print(f"❌ Upload failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Upload error: {e}")
            return False
        
        # Test 4: Upload invalid file type
        print("\n--- TEST 4: Upload Invalid File Type (.txt) ---")
        try:
            files = {
                "file": ("test.txt", b"Some text content", "text/plain")
            }
            
            response = client.post("/api/upload/transcript", files=files)
            
            if response.status_code == 422:
                print("✅ Correctly rejected .txt file:")
                print(f"   - Error: {response.json()['detail'][:60]}...")
            else:
                print(f"❌ Should have rejected file: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Test error: {e}")
            return False
        
        # Test 5: Upload file too large
        print("\n--- TEST 5: Upload File Too Large (6MB) ---")
        try:
            large_content = b"x" * (6 * 1024 * 1024)
            files = {
                "file": ("large.pdf", large_content, "application/pdf")
            }
            
            response = client.post("/api/upload/transcript", files=files)
            
            if response.status_code == 422:
                print("✅ Correctly rejected large file:")
                print(f"   - Error: {response.json()['detail'][:60]}...")
            else:
                print(f"❌ Should have rejected file: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Test error: {e}")
            return False
        
        # Test 6: Download file
        print("\n--- TEST 6: Download Uploaded File ---")
        try:
            response = client.get(f"/api/upload/files/{pdf_filename}")
            
            if response.status_code == 200:
                print(f"✅ File downloaded successfully")
                print(f"   - Content-Type: {response.headers.get('content-type')}")
                print(f"   - Content-Length: {len(response.content)} bytes")
            else:
                print(f"❌ Download failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Download error: {e}")
            return False
        
        # Test 7: Download non-existent file
        print("\n--- TEST 7: Download Non-Existent File ---")
        try:
            response = client.get("/api/upload/files/nonexistent.pdf")
            
            if response.status_code == 404:
                print("✅ Correctly returned 404 for non-existent file")
            else:
                print(f"❌ Should return 404: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Test error: {e}")
            return False
        
        # Test 8: Delete file
        print("\n--- TEST 8: Delete Uploaded File ---")
        try:
            response = client.delete(f"/api/upload/files/{pdf_filename}")
            
            if response.status_code == 204:
                print(f"✅ PDF deleted successfully")
            else:
                print(f"❌ Delete failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Delete error: {e}")
            return False
        
        # Test 9: Verify file is deleted
        print("\n--- TEST 9: Verify File Is Deleted ---")
        try:
            response = client.get(f"/api/upload/files/{pdf_filename}")
            
            if response.status_code == 404:
                print("✅ File no longer accessible after deletion")
            else:
                print(f"❌ File should be gone: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Test error: {e}")
            return False
        
        # Cleanup remaining files
        print("\n--- Cleanup ---")
        try:
            client.delete(f"/api/upload/files/{png_filename}")
            print("✅ Test files cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")
    
    print("\n" + "=" * 70)
    print("✅ ALL API TESTS PASSED!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    try:
        success = test_upload_api()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n❌ Test FAILED with error:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
