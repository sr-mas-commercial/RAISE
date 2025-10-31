// ==================== GOOGLE APPS SCRIPT FOR RAISE SYSTEM ====================
// This script should be deployed as a Web App with access set to "Anyone"

// Configuration
const SHEET_NAME = 'Complaints'; // Name of your Google Sheet tab
const DRIVE_FOLDER_ID = ''; // Optional: Your Google Drive folder ID for photos

// Column indices (0-based)
const COLUMNS = {
  TIMESTAMP: 0,
  NAME: 1,
  MOBILE: 2,
  COMPLAINT_TYPE: 3,
  DESCRIPTION: 4,
  LOCATION: 5,
  ASSET_ID: 6,
  PHOTO: 7,
  STATUS: 8
};

// ==================== POST REQUEST HANDLER ====================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Check if this is a status update request
    if (data.action === 'updateStatus') {
      return handleStatusUpdate(data);
    }
    
    // Otherwise, it's a new complaint submission
    return handleComplaintSubmission(data);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== GET REQUEST HANDLER ====================
function doGet(e) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const headers = data[0];
    const rows = data.slice(1);
    
    // Convert to JSON array
    const jsonData = rows.map(row => {
      return {
        timestamp: row[COLUMNS.TIMESTAMP],
        name: row[COLUMNS.NAME],
        mobile: row[COLUMNS.MOBILE],
        complaintType: row[COLUMNS.COMPLAINT_TYPE],
        description: row[COLUMNS.DESCRIPTION],
        location: row[COLUMNS.LOCATION],
        assetId: row[COLUMNS.ASSET_ID],
        photo: row[COLUMNS.PHOTO],
        status: row[COLUMNS.STATUS]
      };
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== HANDLE COMPLAINT SUBMISSION ====================
function handleComplaintSubmission(data) {
  const sheet = getSheet();
  
  // Handle photo upload
  let photoLink = 'No';
  if (data.photo) {
    if (DRIVE_FOLDER_ID) {
      // Upload to Google Drive
      photoLink = uploadPhotoToDrive(data.photo, data.assetId);
    } else {
      // Store Base64 string (not recommended for large files)
      // For production, always use Drive upload
      photoLink = data.photo.substring(0, 100) + '...'; // Store truncated for reference
      // Or just mark as "Yes"
      photoLink = 'Yes';
    }
  }
  
  // Append new row
  sheet.appendRow([
    data.timestamp,
    data.name,
    data.mobile,
    data.complaintType,
    data.description,
    data.location,
    data.assetId,
    photoLink,
    data.status
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Complaint registered successfully',
      photoLink: photoLink
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== HANDLE STATUS UPDATE ====================
function handleStatusUpdate(data) {
  const sheet = getSheet();
  const rowIndex = parseInt(data.rowIndex) + 2; // +2 because: 0-based index + header row + 1 for sheet row
  const newStatus = data.status;
  
  // Update status column
  sheet.getRange(rowIndex, COLUMNS.STATUS + 1).setValue(newStatus);
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Status updated successfully'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== UPLOAD PHOTO TO DRIVE ====================
function uploadPhotoToDrive(base64Data, assetId) {
  try {
    if (!DRIVE_FOLDER_ID) {
      return 'No';
    }
    
    // Extract base64 content
    const base64Content = base64Data.split(',')[1];
    const mimeType = base64Data.split(',')[0].split(':')[1].split(';')[0];
    
    // Decode base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Content),
      mimeType,
      `complaint_${assetId}_${new Date().getTime()}.jpg`
    );
    
    // Get folder
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Create file
    const file = folder.createFile(blob);
    
    // Make file publicly accessible (optional - remove if you want private)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return file URL
    return file.getUrl();
    
  } catch (error) {
    Logger.log('Error uploading photo: ' + error.toString());
    return 'Upload Failed';
  }
}

// ==================== HELPER FUNCTIONS ====================
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    
    // Add headers
    sheet.appendRow([
      'Timestamp',
      'Name',
      'Mobile',
      'Complaint Type',
      'Description',
      'Location',
      'Asset ID',
      'Photo',
      'Status'
    ]);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, 9);
    headerRange.setBackground('#003366');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
  }
  
  return sheet;
}

// ==================== SETUP FUNCTION ====================
// Run this once to create the sheet with proper formatting
function setupSheet() {
  const sheet = getSheet();
  
  // Set column widths
  sheet.setColumnWidth(1, 150); // Timestamp
  sheet.setColumnWidth(2, 120); // Name
  sheet.setColumnWidth(3, 100); // Mobile
  sheet.setColumnWidth(4, 120); // Complaint Type
  sheet.setColumnWidth(5, 300); // Description
  sheet.setColumnWidth(6, 150); // Location
  sheet.setColumnWidth(7, 100); // Asset ID
  sheet.setColumnWidth(8, 200); // Photo
  sheet.setColumnWidth(9, 100); // Status
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('Sheet setup complete!');
}

// ==================== TEST FUNCTION ====================
// Use this to test the script
function testSubmission() {
  const testData = {
    timestamp: new Date().toLocaleString('en-IN'),
    name: 'Test User',
    mobile: '9876543210',
    complaintType: 'Cleanliness',
    description: 'Test complaint description',
    location: '13.0827, 80.2707',
    assetId: 'TEST-001',
    photo: 'No',
    status: 'Pending'
  };
  
  const result = handleComplaintSubmission(testData);
  Logger.log(result.getContent());
}