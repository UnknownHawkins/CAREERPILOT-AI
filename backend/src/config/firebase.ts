import admin from 'firebase-admin';
import { logger } from '../utils/logger';
import serviceAccount from '../../mini-project-2nd-firebase-adminsdk-fbsvc-5e90febd08.json';

let firebaseApp: admin.app.App | undefined;

export const initializeFirebase = (): void => {
  try {
    if (!admin.apps.length) {
      let credential;

      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
        } catch (e) {
          logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var. Falling back to file.');
        }
      }

      if (!credential) {
        try {
          credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
        } catch (e) {
          logger.error('Failed to load Firebase service account from file. Firebase features will be limited.');
          return;
        }
      }

      firebaseApp = admin.initializeApp({
        credential,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'mini-project-2nd.appspot.com',
      });

      logger.info('🔥 Firebase initialized successfully');
    } else {
      firebaseApp = admin.apps[0] as admin.app.App;
    }
  } catch (error) {
    logger.error('Firebase initialization error:', error);
    // Don't throw to allow app to start without Firebase in dev
  }
};

export const getFirebaseStorage = (): admin.storage.Storage => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.storage();
};

export const getFirebaseAuth = (): admin.auth.Auth => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
};

export const getFirestore = (): admin.firestore.Firestore => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
};

export const uploadFileToFirebase = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<string> => {
  try {
    const bucket = getFirebaseStorage().bucket();
    const filePath = `${folder}/${Date.now()}_${fileName}`;
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: { contentType },
    });

    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    logger.info(`File uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    logger.error('File upload error:', error);
    throw error;
  }
};

export const deleteFileFromFirebase = async (fileUrl: string): Promise<void> => {
  try {
    const bucket = getFirebaseStorage().bucket();

    // Extract file path correctly
    const filePath = fileUrl.split(`${bucket.name}/`)[1];
    const file = bucket.file(filePath);

    await file.delete();
    logger.info(`File deleted successfully: ${filePath}`);
  } catch (error) {
    logger.error('File deletion error:', error);
    throw error;
  }
};
