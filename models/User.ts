import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  dateOfBirth?: Date;
  sex?: string;
  preferredLanguage: string;
  additionalLanguages?: string[];
  heardFrom?: string;
  barriersToLearning?: string[];
  homeAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  educationLevel?: string;
  employmentStatus?: string;
  employerName?: string;
  jobTitle?: string;
  schoolInterest?: string;
  programInterests?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  closestHub?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    distance: number;
    distanceText: string;
  };
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  assignedHub?: mongoose.Types.ObjectId;
  profileCompleted: boolean;
  registrationSource: 'quick' | 'full';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  middleName: {
    type: String,
    required: false,
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: false,
  },
  sex: {
    type: String,
    required: false,
    enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  },
  preferredLanguage: {
    type: String,
    required: [true, 'Preferred language is required'],
    enum: ['English', 'Spanish', 'French', 'Arabic', 'Chinese', 'Other'],
  },
  additionalLanguages: {
    type: [String],
    required: false,
    enum: ['English', 'Spanish', 'French', 'Arabic', 'Chinese', 'Other'],
    default: [],
  },
  heardFrom: {
    type: String,
    required: false,
    enum: ['Google', 'Facebook', 'Friend/Family', 'Community Center', 'School', 'Advertisement', 'Other'],
  },
  barriersToLearning: {
    type: [String],
    required: false,
    default: [],
  },
  homeAddress: {
    street: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    zipCode: {
      type: String,
      required: false,
    },
  },
  address: {
    street: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    zipCode: {
      type: String,
      required: false,
    },
  },
  educationLevel: {
    type: String,
    required: false,
    enum: ['no-hs', 'some-hs', 'ged', 'hs-diploma', 'some-college', 'college-degree'],
  },
  employmentStatus: {
    type: String,
    required: false,
    enum: ['employed', 'unemployed', 'self-employed', 'retired', 'student'],
  },
  employerName: {
    type: String,
    required: false,
    trim: true,
  },
  jobTitle: {
    type: String,
    required: false,
    trim: true,
  },
  schoolInterest: {
    type: String,
    required: false,
  },
  programInterests: {
    type: [String],
    required: false,
    default: [],
  },
  emergencyContact: {
    name: {
      type: String,
      required: false,
      trim: true,
    },
    relationship: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
  },
  closestHub: {
    name: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
    distance: {
      type: Number,
      required: false,
    },
    distanceText: {
      type: String,
      required: false,
    },
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  assignedHub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: false,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  registrationSource: {
    type: String,
    enum: ['quick', 'full'],
    default: 'quick',
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Clear existing model to force schema refresh
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>('User', userSchema); 