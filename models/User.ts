import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  dateOfBirth: Date;
  sex: string;
  preferredLanguage: string;
  additionalLanguages: string[];
  heardFrom: string;
  barriersToLearning: string[];
  homeAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  educationLevel: string;
  employmentStatus: string;
  employerName: string;
  jobTitle: string;
  schoolInterest: string;
  programInterests: string[];
  emergencyContact: {
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
    required: [true, 'Date of birth is required'],
  },
  sex: {
    type: String,
    required: [true, 'Sex is required'],
    enum: ['Male', 'Female', 'Other'],
  },
  preferredLanguage: {
    type: String,
    required: [true, 'Preferred language is required'],
    enum: ['English', 'Spanish', 'French', 'Other'],
  },
  additionalLanguages: {
    type: [String],
    required: false,
    enum: ['English', 'Spanish', 'French', 'Other'],
    default: [],
  },
  heardFrom: {
    type: String,
    required: [true, 'Heard from is required'],
    enum: ['Google', 'Facebook', 'Friend', 'Other'],
  },
  barriersToLearning: {
    type: [String],
    required: [true, 'Barriers to learning are required'],
    enum: ['Language', 'Literacy', 'Technology', 'Transportation', 'Other'],
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'At least one barrier to learning is required'
    },
    default: [],
  },
  homeAddress: {
    street: {
      type: String,
      required: [true, 'Home street address is required'],
    },
    city: {
      type: String,
      required: [true, 'Home city is required'],
    },
    state: {
      type: String,
      required: [true, 'Home state is required'],
    },
    zipCode: {
      type: String,
      required: [true, 'Home ZIP code is required'],
    },
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
    },
  },
  educationLevel: {
    type: String,
    required: [true, 'Education level is required'],
    enum: ['High School', 'Some College', 'Associate Degree', 'Bachelor Degree', 'Graduate Degree', 'Other'],
  },
  employmentStatus: {
    type: String,
    required: [true, 'Employment status is required'],
    enum: ['Employed', 'Unemployed', 'Student', 'Retired', 'Other'],
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
    required: [true, 'School interest is required'],
    enum: ['School 1', 'School 2', 'School 3', 'School 4', 'School 5', 'School 6', 'School 7', 'School 8'],
    default: '',
  },
  programInterests: {
    type: [String],
    required: [true, 'Program interests are required'],
    enum: {
      values: ['Adult Basic Education', 'ESL', 'CTE'],
      message: 'Program interests must be Adult Basic Education, ESL, or CTE'
    },
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'At least one program interest is required'
    },
    default: [],
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true,
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
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
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
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