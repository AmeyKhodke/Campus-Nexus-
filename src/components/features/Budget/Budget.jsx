import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  PieChart,
  BarChart2,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  Download,
  Plus,
  Filter,
  Send,
  FileText,
  Upload,
  X,
  CheckCircle,
  User,
  Mail,
  GraduationCap,
  Search,
  ChevronDown,
  XCircle,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { database as db, auth } from '@/config/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { ref, set, push, onValue, get, query as dbQuery, orderByChild, equalTo, update, getDatabase } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Cloudinary Configuration
const cloudinaryCloudName = 'dc3pfqjlh';
const cloudinaryUploadPreset = 'CampusNexus';
const cloudinaryApiEndpoint = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/upload`;

// Format currency helper function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Mock data for the budget dashboard
const mockBudgetData = {
  totalBudget: 5000,
  spent: 3250,
  remaining: 1750,
  categories: [
    { name: 'Books & Supplies', allocated: 1500, spent: 1200 },
    { name: 'Food & Dining', allocated: 1200, spent: 800 },
    { name: 'Transportation', allocated: 800, spent: 600 },
    { name: 'Entertainment', allocated: 500, spent: 300 },
    { name: 'Miscellaneous', allocated: 1000, spent: 350 }
  ],
  recentTransactions: [
    {
      id: 1,
      description: 'Computer Science Textbook',
      amount: 150,
      category: 'Books & Supplies',
      date: '2024-03-10'
    },
    {
      id: 2,
      description: 'Campus Cafeteria',
      amount: 25,
      category: 'Food & Dining',
      date: '2024-03-09'
    },
    {
      id: 3,
      description: 'Bus Pass - Monthly',
      amount: 60,
      category: 'Transportation',
      date: '2024-03-08'
    },
    {
      id: 4,
      description: 'Movie Night',
      amount: 35,
      category: 'Entertainment',
      date: '2024-03-07'
    },
    {
      id: 5,
      description: 'Lab Supplies',
      amount: 80,
      category: 'Books & Supplies',
      date: '2024-03-06'
    },
    {
      id: 6,
      description: 'Coffee Shop',
      amount: 15,
      category: 'Food & Dining',
      date: '2024-03-05'
    }
  ],
  monthlySpending: [
    { month: 'Jan', amount: 850 },
    { month: 'Feb', amount: 920 },
    { month: 'Mar', amount: 780 },
    { month: 'Apr', amount: 650 },
    { month: 'May', amount: 900 }
  ]
};

const BudgetApplicationForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    email: '',
    department: '',
    year: '',
    budgetCategory: '',
    requestedAmount: '',
    purpose: '',
    justification: '',
    duration: '',
    expectedOutcomes: '',
    attachments: []
  });

  const [dragOver, setDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const categories = [
    'Books & Supplies',
    'Food & Dining',
    'Transportation',
    'Entertainment',
    'Research Materials',
    'Project Expenses',
    'Emergency Fund',
    'Equipment',
    'Software/Technology',
    'Miscellaneous'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryUploadPreset);
    formData.append('cloud_name', cloudinaryCloudName);

    try {
      const response = await fetch(cloudinaryApiEndpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
        throw new Error(errorData.error?.message || `Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.secure_url) {
        throw new Error('No secure URL received from Cloudinary');
      }
      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  };

  const handleFileUpload = async (files) => {
    setUploadProgress(0);
    const totalFiles = files.length;
    let uploadedCount = 0;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File ${file.name} has unsupported format. Allowed formats: JPG, PNG, PDF, DOC, DOCX`);
        }

        const url = await uploadToCloudinary(file);
        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
        
        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: url
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedFiles]
      }));
      setUploadProgress(100);
    } catch (error) {
      setError(`File upload failed: ${error.message}`);
      console.error('Upload error:', error);
      setUploadProgress(0);
    }
  };

  const removeAttachment = (id) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(file => file.id !== id)
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const userId = auth.currentUser?.uid;

      if (!userId) {
        throw new Error('You must be logged in to submit a budget request');
      }

      // Upload files to Cloudinary first
      const uploadedAttachments = await Promise.all(
        formData.attachments.map(async (file) => {
          const formDataObj = new FormData();
          formDataObj.append('file', file.url); // Use the file URL if it's already uploaded
          formDataObj.append('upload_preset', cloudinaryUploadPreset);
          formDataObj.append('cloud_name', cloudinaryCloudName);

          try {
            const response = await fetch(cloudinaryApiEndpoint, {
              method: 'POST',
              body: formDataObj
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Cloudinary error:', errorData);
              throw new Error(errorData.error?.message || `Upload failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              url: data.secure_url
            };
          } catch (error) {
            console.error('File upload error:', error);
            throw new Error(`Failed to upload file ${file.name}: ${error.message}`);
          }
        })
      );

      // Create budget request data
      const budgetRequest = {
        userId,
        userEmail: auth.currentUser?.email,
        userName: auth.currentUser?.displayName || formData.studentName,
        studentId: formData.studentId,
        department: formData.department,
        year: formData.year,
        budgetCategory: formData.budgetCategory,
        requestedAmount: parseFloat(formData.requestedAmount),
        purpose: formData.purpose,
        justification: formData.justification,
        duration: formData.duration,
        expectedOutcomes: formData.expectedOutcomes,
        attachments: uploadedAttachments,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Save to Firebase Realtime Database
      const database = getDatabase();
      const budgetRequestsRef = ref(database, 'budget_requests');
      const newRequestRef = push(budgetRequestsRef);
      await set(newRequestRef, budgetRequest);

      // Create notification for the user
      const notificationsRef = ref(database, 'notifications');
      const newNotificationRef = push(notificationsRef);
      await set(newNotificationRef, {
        userId,
        recipient: userId,
        title: 'Budget Request Submitted',
        message: `Your budget request for ${formatCurrency(formData.requestedAmount)} has been submitted successfully.`,
        type: 'success',
        read: false,
        createdAt: Date.now()
      });

      // Create notification for faculty/admin
      const adminNotificationRef = push(notificationsRef);
      await set(adminNotificationRef, {
        recipient: 'admin',
        title: 'New Budget Request',
        message: `A new budget request for ${formatCurrency(formData.requestedAmount)} has been submitted by ${auth.currentUser?.displayName || formData.studentName}.`,
        type: 'info',
        read: false,
        createdAt: Date.now(),
        requestId: newRequestRef.key
      });

      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          studentName: '',
          studentId: '',
          email: auth.currentUser?.email,
          department: '',
          year: '',
          budgetCategory: '',
          requestedAmount: '',
          purpose: '',
          justification: '',
          duration: '',
          expectedOutcomes: '',
          attachments: []
        });
        setSubmitSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
      let errorMessage = 'Failed to submit budget request. Please try again.';
      
      if (error.message.includes('Cloudinary')) {
        errorMessage = 'Failed to upload attachments. Please try again or contact support.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to submit budget requests. Please ensure you are properly logged in.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Unable to save budget request. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Apply for Budget</h2>
              <p className="text-gray-600 mt-1">Submit a budget request to faculty for approval</p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 m-6 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {submitSuccess ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted Successfully!</h3>
            <p className="text-gray-600">Your budget request has been sent to faculty for review. You'll receive a notification once it's been processed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Student Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Arts & Sciences">Arts & Sciences</option>
                    <option value="Medicine">Medicine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Budget Request Details */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Request Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="budgetCategory"
                    value={formData.budgetCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requested Amount</label>
                  <input
                    type="number"
                    name="requestedAmount"
                    value={formData.requestedAmount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purpose/Title</label>
                  <input
                    type="text"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of what the budget is for"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Duration</option>
                    <option value="One-time">One-time</option>
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detailed Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Justification</label>
                  <textarea
                    name="justification"
                    value={formData.justification}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this budget is necessary and how it will benefit your studies..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Outcomes</label>
                  <textarea
                    name="expectedOutcomes"
                    value={formData.expectedOutcomes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the expected outcomes and benefits..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* File Attachments */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Supporting Documents
              </h3>
              <div
                className={`border-2 border-dashed p-6 rounded-lg text-center transition-colors ${
                  dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop files here, or click to select</p>
                <p className="text-sm text-gray-500">Support for invoices, receipts, quotations (PDF, JPG, PNG)</p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="mt-2"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>
              
              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAttachment(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Add NotificationBell component
const NotificationBell = ({ count, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
    onClick={onClick}
  >
    <Bell className="h-6 w-6" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </motion.button>
);

// Add NotificationPanel component
const NotificationPanel = ({ notifications, onClose, onMarkAsRead }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    className="absolute right-0 top-16 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
  >
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
    <div className="max-h-[400px] overflow-y-auto">
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No new notifications
        </div>
      ) : (
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => onMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  notification.type === 'success' ? 'bg-green-100' :
                  notification.type === 'error' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  {notification.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : notification.type === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Bell className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  </motion.div>
);

const Budget = () => {
  const [budgetData, setBudgetData] = useState({
    totalBudget: 5000,
    spent: 0,
    remaining: 5000,
    requests: [],
    categories: [],
    recentTransactions: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [categoryStats, setCategoryStats] = useState([]);
  const [monthlySpending, setMonthlySpending] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      toast.error('Please sign in to view your budget');
      return;
    }

    // Listen to student's budget data
    const database = getDatabase();
    const budgetRef = ref(database, `student_budgets/${userId}`);
    const budgetUnsubscribe = onValue(budgetRef, async (snapshot) => {
      const data = snapshot.val() || { totalSpent: 0, totalBudget: 5000 };
      
      // Calculate category-wise spending
      const categoriesRef = ref(database, `budget_categories/${userId}`);
      const categoriesSnapshot = await get(categoriesRef);
      const categoriesData = categoriesSnapshot.val() || {};
      
      const categories = Object.entries(categoriesData).map(([category, data]) => ({
        name: category,
        allocated: data.allocated || 0,
        spent: data.spent || 0
      }));

      // Calculate monthly spending
      const now = new Date();
      const monthlyData = Array(6).fill(0).map((_, index) => {
        const month = new Date(now.getFullYear(), now.getMonth() - index, 1);
        const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
        return {
          month: month.toLocaleString('default', { month: 'short' }),
          amount: data.monthlySpending?.[monthKey] || 0
        };
      }).reverse();

      setBudgetData(prev => ({
        ...prev,
        totalBudget: data.totalBudget || 5000,
        spent: data.totalSpent || 0,
        remaining: (data.totalBudget || 5000) - (data.totalSpent || 0),
        categories
      }));
      setMonthlySpending(monthlyData);
      setCategoryStats(categories);
    });

    // Listen to student's budget requests
    const requestsRef = ref(database, 'budget_requests');
    const requestsUnsubscribe = onValue(requestsRef, (snapshot) => {
      const requests = [];
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        if (request.userId === userId) {
          requests.push({
            id: childSnapshot.key,
            ...request
          });
        }
      });

      // Sort requests by date
      requests.sort((a, b) => b.createdAt - a.createdAt);

      setBudgetData(prev => ({
        ...prev,
        requests,
        recentTransactions: requests
          .filter(req => req.status === 'approved')
          .slice(0, 5)
          .map(req => ({
            id: req.id,
            description: req.purpose,
            amount: req.requestedAmount,
            category: req.budgetCategory,
            date: new Date(req.createdAt).toISOString().split('T')[0]
          }))
      }));
      setIsLoading(false);
    });

    // Listen to notifications
    const notificationsRef = ref(database, `notifications/users/${userId}`);
    
    const notificationsUnsubscribe = onValue(notificationsRef, (snapshot) => {
      const notificationsData = [];
      snapshot.forEach((childSnapshot) => {
        notificationsData.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Sort notifications by date (newest first)
      notificationsData.sort((a, b) => b.createdAt - a.createdAt);
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    });

    return () => {
      budgetUnsubscribe();
      requestsUnsubscribe();
      notificationsUnsubscribe();
    };
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      const userId = auth.currentUser?.uid;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create budget request
      const database = getDatabase();
      const requestsRef = ref(database, 'budget_requests');
      const newRequestRef = push(requestsRef);
      
      const requestData = {
        ...formData,
        userId,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await set(newRequestRef, requestData);

      // Update category allocation if needed
      const categoryRef = ref(database, `budget_categories/${userId}/${formData.budgetCategory}`);
      const categorySnapshot = await get(categoryRef);
      const categoryData = categorySnapshot.val() || { allocated: 0, spent: 0 };

      if (formData.requestedAmount > categoryData.allocated) {
        await set(categoryRef, {
          ...categoryData,
          allocated: formData.requestedAmount
        });
      }

      toast.success('Budget request submitted successfully');
      setShowApplicationForm(false);
    } catch (error) {
      console.error('Error submitting budget request:', error);
      toast.error(error.message || 'Failed to submit budget request');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const userId = auth.currentUser?.uid;

      if (!userId) return;

      const notificationRef = ref(database, `notifications/${notificationId}`);
      await update(notificationRef, {
        read: true,
        updatedAt: Date.now()
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredRequests = budgetData.requests.filter(request => {
    const matchesSearch = request.purpose?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Budget Dashboard</h1>
            <p className="text-gray-600">Track and manage your student expenses</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowApplicationForm(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Budget Request
            </Button>
            <div className="relative">
              <NotificationBell
                count={unreadCount}
                onClick={() => setShowNotifications(!showNotifications)}
              />
              <AnimatePresence>
                {showNotifications && (
                  <NotificationPanel
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onMarkAsRead={handleMarkAsRead}
                  />
                )}
              </AnimatePresence>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <h3 className="text-2xl font-bold">₹{budgetData.totalBudget.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Progress 
              value={(budgetData.spent / budgetData.totalBudget) * 100} 
              className="mt-4"
            />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Spent</p>
                <h3 className="text-2xl font-bold">₹{budgetData.spent.toLocaleString()}</h3>
                <p className="text-sm text-gray-500">
                  {((budgetData.spent / budgetData.totalBudget) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <h3 className="text-2xl font-bold">₹{budgetData.remaining.toLocaleString()}</h3>
                <p className="text-sm text-gray-500">Available to spend</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Category Spending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Category Spending</h3>
            <div className="space-y-4">
              {categoryStats.map((category) => (
                <div key={category.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{category.name}</span>
                    <span>₹{category.spent.toLocaleString()} / ₹{category.allocated.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(category.spent / category.allocated) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
            <div className="h-64">
              {/* Add your preferred charting library here */}
              <div className="grid grid-cols-6 gap-2 h-full items-end">
                {monthlySpending.map((data) => (
                  <div key={data.month} className="flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ 
                        height: `${(data.amount / Math.max(...monthlySpending.map(d => d.amount))) * 100}%`,
                        minHeight: '20px'
                      }}
                    />
                    <span className="text-xs mt-2">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-4">
              {budgetData.recentTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{transaction.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* Budget Requests List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Budget Requests</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No budget requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{request.purpose}</h3>
                          <p className="text-sm text-gray-500">
                            Requested on {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'approved'
                              ? 'success'
                              : request.status === 'rejected'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Amount: ₹{request.requestedAmount.toLocaleString()}
                        </p>
                        {request.approvalNote && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Note:</strong> {request.approvalNote}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Budget Application Form Modal */}
      <AnimatePresence>
        {showApplicationForm && (
          <BudgetApplicationForm
            isOpen={showApplicationForm}
            onClose={() => setShowApplicationForm(false)}
            onSubmit={handleFormSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Budget;