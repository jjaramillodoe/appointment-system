import mongoose from 'mongoose';

export interface IHubConfig extends mongoose.Document {
  hubName: string;
  daysOff: string[]; // e.g., ["2024-07-15", "2024-07-18"]
  customSlots: {
    [date: string]: string[]; // e.g., { "2024-07-16": ["9:00 AM", "9:30 AM"] }
  };
  defaultSlots: string[];
  slotCapacities: {
    [date: string]: {
      [time: string]: {
        capacity: number;
        isActive: boolean;
      };
    };
  };
}

const hubConfigSchema = new mongoose.Schema<IHubConfig>({
  hubName: { type: String, required: true, unique: true },
  daysOff: { type: [String], default: [] },
  customSlots: { type: Object, default: {} }, // e.g., { "2024-07-16": ["9:00 AM", "9:30 AM"] }
  defaultSlots: { type: [String], default: [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"
  ] },
  slotCapacities: { type: Object, default: {} },
});

if (mongoose.models.HubConfig) {
  delete mongoose.models.HubConfig;
}

export default mongoose.model<IHubConfig>('HubConfig', hubConfigSchema); 