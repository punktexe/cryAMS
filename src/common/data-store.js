import fs from 'fs';
import path from 'path';

// Data storage for profiles and pending requests (no message storage)
const profiles = new Map(); // uuid -> profile data
const pendingRequests = new Map(); // uuid -> pending request data
const DATA_FILE = 'data/profiles.json';
const PENDING_FILE = 'data/pending-requests.json';

export class DataStore {
  static initialize() {
    // Erstelle data-Verzeichnis falls es nicht existiert
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Lade existierende Profile und Anfragen
    this.loadProfiles();
    this.loadPendingRequests();
  }

  static loadProfiles() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const profilesArray = JSON.parse(data);
        
        profiles.clear();
        profilesArray.forEach(profile => {
          profiles.set(profile.uuid, profile);
        });
        
        console.log(`📁 ${profiles.size} Profile aus ${DATA_FILE} geladen`);
      } else {
        console.log(`📁 Keine existierenden Profile gefunden, starte mit leerer Datenbank`);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Profile:', error);
      console.log('📁 Starte mit leerer Datenbank');
    }
  }

  static loadPendingRequests() {
    try {
      if (fs.existsSync(PENDING_FILE)) {
        const data = fs.readFileSync(PENDING_FILE, 'utf8');
        const requestsArray = JSON.parse(data);
        
        pendingRequests.clear();
        requestsArray.forEach(request => {
          pendingRequests.set(request.uuid, request);
        });
        
        console.log(`📋 ${pendingRequests.size} ausstehende Anfragen aus ${PENDING_FILE} geladen`);
      }
    } catch (error) {
      console.error('Fehler beim Laden der ausstehenden Anfragen:', error);
    }
  }

  static saveProfiles() {
    try {
      const profilesArray = Array.from(profiles.values());
      const data = JSON.stringify(profilesArray, null, 2);
      fs.writeFileSync(DATA_FILE, data, 'utf8');
      console.log(`💾 ${profilesArray.length} Profile in ${DATA_FILE} gespeichert`);
    } catch (error) {
      console.error('Fehler beim Speichern der Profile:', error);
    }
  }

  static savePendingRequests() {
    try {
      const requestsArray = Array.from(pendingRequests.values());
      const data = JSON.stringify(requestsArray, null, 2);
      fs.writeFileSync(PENDING_FILE, data, 'utf8');
      console.log(`💾 ${requestsArray.length} ausstehende Anfragen in ${PENDING_FILE} gespeichert`);
    } catch (error) {
      console.error('Fehler beim Speichern der ausstehenden Anfragen:', error);
    }
  }

  static createProfile(profileData) {
    const { uuid, name, email, description } = profileData;
    const profile = {
      uuid,
      name,
      email,
      description,
      createdAt: new Date().toISOString()
    };
    
    profiles.set(uuid, profile);
    this.saveProfiles();
    
    return uuid;
  }

  static getProfile(uuid) {
    return profiles.get(uuid);
  }

  static getAllProfiles() {
    return Array.from(profiles.entries()).map(([uuid, profile]) => ({
      uuid,
      ...profile
    }));
  }

  static deleteProfile(uuid) {
    const deleted = profiles.delete(uuid);
    if (deleted) {
      this.saveProfiles();
    }
    return deleted;
  }

  // Methoden für ausstehende Anfragen
  static createPendingRequest(requestData) {
    const { uuid, name, email, description } = requestData;
    const request = {
      uuid,
      name,
      email,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    pendingRequests.set(uuid, request);
    this.savePendingRequests();
    
    return uuid;
  }

  static getAllPendingRequests() {
    return Array.from(pendingRequests.entries()).map(([uuid, request]) => ({
      uuid,
      ...request
    }));
  }

  static approvePendingRequest(uuid) {
    const request = pendingRequests.get(uuid);
    if (request) {
      // Erstelle genehmigtes Profil
      const profileUuid = this.createProfile({
        uuid: request.uuid,
        name: request.name,
        email: request.email,
        description: request.description
      });
      
      // Entferne aus pending requests
      pendingRequests.delete(uuid);
      this.savePendingRequests();
      
      return profileUuid;
    }
    return null;
  }

  static rejectPendingRequest(uuid) {
    const deleted = pendingRequests.delete(uuid);
    if (deleted) {
      this.savePendingRequests();
    }
    return deleted;
  }
}
