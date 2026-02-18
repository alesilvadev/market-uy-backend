export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    where: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(),
        offset: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      get: jest.fn(),
    })),
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        offset: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
    })),
  })),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(),
  })),
};

export const mockInitializeFirebase = jest.fn();
export const mockGetFirestoreDb = jest.fn(() => mockFirestore);

jest.mock('../utils/firebase', () => ({
  initializeFirebase: mockInitializeFirebase,
  getFirestoreDb: mockGetFirestoreDb,
}));
