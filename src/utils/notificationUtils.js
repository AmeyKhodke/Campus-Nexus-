import { ref, push, serverTimestamp, set } from 'firebase/database';
import { database } from '../config/firebase';

export const createNotification = async (userId, data) => {
  try {
    const notificationsRef = ref(database, `notifications/users/${userId}`);
    const newNotificationRef = push(notificationsRef);
    
    await set(newNotificationRef, {
      ...data,
      timestamp: serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const createLoginNotification = async (user) => {
  try {
    await createNotification(user.uid, {
      type: 'auth',
      category: 'authentication',
      title: `${user.userProfile?.role?.toUpperCase() || 'User'} Login`,
      message: `${user.displayName || user.email} logged in as ${user.userProfile?.role || 'user'}`,
      metadata: {
        role: user.userProfile?.role || 'user',
        email: user.email,
        loginTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating login notification:', error);
  }
};

export const createApplicationNotification = async (application, user) => {
  try {
    await createNotification(user.uid, {
      type: 'application',
      category: 'application',
      title: 'New Application Submitted',
      message: `${user.displayName || 'A user'} submitted a new ${application.type || 'general'} application`,
      applicationId: application.id,
      applicationType: application.type
    });
  } catch (error) {
    console.error('Error creating application notification:', error);
  }
};

export const createComplaintNotification = async (userId, complaintId, status, message) => {
  try {
    await createNotification(userId, {
      type: 'complaint',
      category: 'complaint',
      complaintId: complaintId,
      status: status,
      message: message
    });
  } catch (error) {
    console.error('Error creating complaint notification:', error);
  }
};

export const createElectionNotification = async (userId, data) => {
  try {
    await createNotification(userId, {
      type: 'election',
      category: 'election',
      ...data
    });
  } catch (error) {
    console.error('Error creating election notification:', error);
  }
};

export const createFacilityBookingNotification = async (booking, user) => {
  try {
    await createNotification(user.uid, {
      type: 'facility',
      category: 'facility',
      title: 'New Facility Booking',
      message: `${user.displayName || 'A user'} requested to book ${booking.facilityName}`,
      bookingId: booking.id,
      facilityName: booking.facilityName
    });
  } catch (error) {
    console.error('Error creating facility booking notification:', error);
  }
};

export const createFacultyActionNotification = async (action, user, itemType, itemId) => {
  try {
    await createNotification(user.uid, {
      type: itemType,
      category: itemType,
      title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} ${action}`,
      message: `${user.displayName || 'Faculty member'} ${action} the ${itemType}`,
      action: action,
      itemId: itemId
    });
  } catch (error) {
    console.error('Error creating faculty action notification:', error);
  }
}; 