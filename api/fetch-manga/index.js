import { google } from 'googleapis';

const FOLDER_ID = '1Zcrof3s192GU49Lu8AXjtyWS33eBSrJW';

export default async function handler(req, res) {
  // Check if credentials are provided in env vars
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return res.status(500).json({ error: 'Google Credentials not set on server.' });
  }

  let credentials;
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to parse Google Credentials.' });
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const { fileId, fileName } = req.query;

  // Prevent Vercel / CDN from caching stale responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  try {
    // If no fileId and no fileName, list ALL contents of the folder (paginated)
    if (!fileId && !fileName) {
      const allFiles = [];
      let pageToken = undefined;

      // Loop through all pages — Drive API defaults to 100 files per page
      do {
        const response = await drive.files.list({
          q: `'${FOLDER_ID}' in parents and mimeType = 'application/pdf' and trashed = false`,
          fields: 'nextPageToken, files(id, name, thumbnailLink, createdTime, modifiedTime, size)',
          orderBy: 'name',
          pageSize: 1000, // Maximum allowed per request
          pageToken,
        });

        allFiles.push(...(response.data.files || []));
        pageToken = response.data.nextPageToken;
      } while (pageToken);

      return res.status(200).json(allFiles);
    }

    let targetFileId = fileId;
    
    if (fileName) {
      // Escape single quotes for drive query
      const safeName = fileName.replace(/'/g, "\\'");
      const listRes = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and name = '${safeName}' and mimeType = 'application/pdf' and trashed = false`,
        fields: 'files(id)'
      });
      if (!listRes.data.files || listRes.data.files.length === 0) {
        return res.status(404).json({ error: 'File not found on drive' });
      }
      targetFileId = listRes.data.files[0].id;
    }

    // If targetFileId exists, stream the PDF media
    const file = await drive.files.get(
      { fileId: targetFileId, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', 'application/pdf');
    file.data.pipe(res);
  } catch (err) {
    console.error('Drive API Error:', err);
    res.status(500).json({ error: err.message });
  }
}
