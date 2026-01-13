import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: parseError.message },
        { status: 400 }
      );
    }
    
    // Validate required fields exist
    const requiredFields = ['email', 'password', 'firstName', 'lastName', 'phone', 'dateOfBirth', 'sex', 'preferredLanguage', 'heardFrom', 'barriersToLearning', 'homeAddress', 'address', 'educationLevel', 'employmentStatus', 'schoolInterest', 'programInterests', 'emergencyContact'];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const {
      email,
      password,
      firstName,
      middleName,
      lastName,
      phone,
      dateOfBirth,
      sex,
      preferredLanguage,
      additionalLanguages,
      heardFrom,
      barriersToLearning,
      homeAddress,
      address,
      educationLevel,
      employmentStatus,
      employerName,
      jobTitle,
      schoolInterest,
      programInterests,
      emergencyContact,
      closestHub,
    } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    let flatHub = closestHub;
    if (closestHub) {
      // Handle both flat structure and nested hub structure
      if (closestHub.hub) {
        flatHub = {
          name: closestHub.hub.name,
          address: closestHub.hub.address,
          latitude: closestHub.hub.latitude,
          longitude: closestHub.hub.longitude,
          distance: closestHub.distance,
          distanceText: closestHub.distanceText,
        };
      } else {
        // Already in flat structure, use as is
        flatHub = {
          name: closestHub.name,
          address: closestHub.address,
          latitude: closestHub.latitude,
          longitude: closestHub.longitude,
          distance: closestHub.distance,
          distanceText: closestHub.distanceText,
        };
      }
    }

    // Create new user
    // Convert dateOfBirth to proper Date object if it's a string
    const parsedDateOfBirth = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

    // Clean up emergency contact data (remove extra spaces)
    const cleanedEmergencyContact = {
      name: emergencyContact.name.trim().replace(/\s+/g, ' '),
      relationship: emergencyContact.relationship.trim(),
      phone: emergencyContact.phone.trim(),
    };

    const userData = {
      email: email.trim().toLowerCase(),
      password,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      dateOfBirth: parsedDateOfBirth,
      sex,
      preferredLanguage,
      additionalLanguages,
      heardFrom,
      barriersToLearning,
      homeAddress: {
        street: homeAddress.street.trim(),
        city: homeAddress.city.trim(),
        state: homeAddress.state.trim(),
        zipCode: homeAddress.zipCode.trim(),
      },
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipCode: address.zipCode.trim(),
      },
      educationLevel,
      employmentStatus,
      employerName: employerName.trim(),
      jobTitle: jobTitle.trim(),
      schoolInterest,
      programInterests,
      emergencyContact: cleanedEmergencyContact,
      closestHub: flatHub,
    };

    let user;
    try {
      user = new User(userData);
    } catch (modelError: any) {
      console.error('User model creation error:', modelError);
      console.error('Model error details:', {
        name: modelError.name,
        message: modelError.message,
        errors: modelError.errors
      });
      throw modelError;
    }

    try {
      await user.save();
    } catch (saveError: any) {
      console.error('User save error:', saveError);
      console.error('Validation errors:', saveError.errors);
      throw saveError;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      sex: user.sex,
      preferredLanguage: user.preferredLanguage,
      additionalLanguages: user.additionalLanguages,
      heardFrom: user.heardFrom,
      barriersToLearning: user.barriersToLearning,
      homeAddress: user.homeAddress,
      address: user.address,
      educationLevel: user.educationLevel,
      employmentStatus: user.employmentStatus,
      employerName: user.employerName,
      jobTitle: user.jobTitle,
      schoolInterest: user.schoolInterest || '',
      programInterests: user.programInterests || [],
      emergencyContact: user.emergencyContact,
      closestHub: user.closestHub || '',
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: userResponse,
        token 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { error: 'Validation failed', details: error.message, validationErrors: error.errors },
        { status: 400 }
      );
    }
    
    // Check if it's a duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
} 