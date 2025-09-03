// Data storage for profiles and messages
const profiles = new Map(); // uuid -> profile data
const messages = new Map(); // uuid -> array of messages

export class DataStore {
  static createProfile(profileData) {
    const { uuid, name, email, description } = profileData;
    profiles.set(uuid, {
      name,
      email,
      description,
      createdAt: new Date().toISOString(),
      messages: []
    });
    messages.set(uuid, []);
    return uuid;
  }

  static getProfile(uuid) {
    return profiles.get(uuid);
  }

  static addMessage(uuid, messageData) {
    const profile = profiles.get(uuid);
    if (!profile) return false;

    const message = {
      id: Date.now().toString(),
      content: messageData.content,
      senderName: messageData.senderName || 'Anonym',
      timestamp: new Date().toISOString()
    };

    const userMessages = messages.get(uuid) || [];
    userMessages.push(message);
    messages.set(uuid, userMessages);
    
    profile.messages = userMessages;
    return true;
  }

  static getMessages(uuid) {
    return messages.get(uuid) || [];
  }

  static getAllProfiles() {
    return Array.from(profiles.entries()).map(([uuid, profile]) => ({
      uuid,
      ...profile
    }));
  }
}
