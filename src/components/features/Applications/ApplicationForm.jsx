import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { useForm } from 'react-hook-form';
import { Calendar, FileText, Users, X, Upload, Paperclip, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { database } from '@/config/firebase';
import { ref, push, set, get, serverTimestamp } from 'firebase/database';
import { useAuthContext } from '@/providers/AuthProvider';
import { createApplicationNotification } from '../../../utils/notificationUtils';

const CLOUDINARY_UPLOAD_PRESET = 'CampusNexus'; // Create this in your Cloudinary settings
const CLOUDINARY_CLOUD_NAME = 'dc3pfqjlh'; // Replace with your cloud name

const ApplicationForm = ({ onClose }) => {
  const { user } = useAuthContext();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const form = useForm({
    defaultValues: {
      type: '',
      subject: '',
      priority: '',
      description: '',
      startDate: '',
      endDate: '',
      documents: [],
      additionalInfo: '',
    },
  });

  const applicationTypes = [
    {
      id: 'leave',
      title: 'Leave Request',
      icon: Calendar,
      color: 'bg-teal-50 text-teal-600',
      category: 'academic'
    },
    {
      id: 'course-change',
      title: 'Course Change',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
      category: 'academic'
    },
    {
      id: 'scholarship',
      title: 'Scholarship',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      category: 'financial'
    },
    {
      id: 'event-permission',
      title: 'Event Permission',
      icon: Users,
      color: 'bg-orange-50 text-orange-600',
      category: 'administrative'
    },
  ];

  const priorityLevels = [
    {
      value: 'low',
      label: 'Low Priority',
      description: 'Non-urgent requests that can be processed within 2 weeks',
      icon: Clock,
      color: 'bg-green-100 text-green-600',
      borderColor: 'border-green-200',
    },
    {
      value: 'medium',
      label: 'Medium Priority',
      description: 'Standard requests that should be processed within 1 week',
      icon: AlertCircle,
      color: 'bg-blue-100 text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      value: 'high',
      label: 'High Priority',
      description: 'Urgent requests that need attention within 3-4 days',
      icon: AlertTriangle,
      color: 'bg-orange-100 text-orange-600',
      borderColor: 'border-orange-200',
    },
    {
      value: 'urgent',
      label: 'Urgent Priority',
      description: 'Critical requests that require immediate attention (within 24-48 hours)',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
      borderColor: 'border-red-200',
    },
  ];

  const steps = [
    { id: 1, name: 'Basic Info' },
    { id: 2, name: 'Details' },
    { id: 3, name: 'Documents' },
  ];

  const validateStep = (currentStep) => {
    const values = form.getValues();
    
    switch (currentStep) {
      case 1:
        if (!values.type) {
          toast.error('Please select an application type');
          return false;
        }
        if (!values.subject || values.subject.length < 5) {
          toast.error('Please enter a subject (minimum 5 characters)');
          return false;
        }
        if (!values.priority) {
          toast.error('Please select a priority level');
          return false;
        }
        return true;

      case 2:
        if (!values.description || values.description.length < 20) {
          toast.error('Please provide a detailed description (minimum 20 characters)');
          return false;
        }
        if (!values.startDate) {
          toast.error('Please select a start date');
          return false;
        }
        if (!values.endDate) {
          toast.error('Please select an end date');
          return false;
        }
        if (new Date(values.endDate) < new Date(values.startDate)) {
          toast.error('End date cannot be before start date');
          return false;
        }
        return true;

      case 3:
        return true; // Documents are optional

      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      // Validate files
      const invalidFiles = files.filter(
        file => !allowedTypes.includes(file.type) || file.size > maxSize
      );

      if (invalidFiles.length > 0) {
        toast.error('Some files were not added. Please ensure files are PDF, Word, or images under 5MB.');
        return;
      }

      const newFiles = files.map(file => ({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        progress: 0,
        uploaded: false,
        url: null
      }));

      setSelectedFiles(prev => [...prev, ...newFiles]);
      form.setValue('documents', [...(form.getValues('documents') || []), ...newFiles]);

    } catch (error) {
      console.error('Error handling files:', error);
      toast.error('Error handling files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files?.length) {
      handleFileSelect({ target: { files } });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    const currentDocs = form.getValues('documents') || [];
    form.setValue('documents', currentDocs.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `campus-nexus/${user.uid}`);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return {
        url: data.secure_url,
        public_id: data.public_id,
        resource_type: data.resource_type
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return [];

    const uploadPromises = selectedFiles.map(async (fileObj) => {
      if (fileObj.uploaded && fileObj.url) return fileObj;

      try {
        const uploadResult = await uploadToCloudinary(fileObj.file);
        return {
          ...fileObj,
          uploaded: true,
          url: uploadResult.url,
          public_id: uploadResult.public_id,
          resource_type: uploadResult.resource_type
        };
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation
    if (!validateStep(step)) return;

    setIsSubmitting(true);

    try {
      // 1. Upload files first if any
      let uploadedDocs = [];
      if (selectedFiles.length > 0) {
        toast.loading('Uploading documents...', { id: 'upload-toast' });
        uploadedDocs = await uploadFiles();
        toast.success('Documents uploaded successfully!', { id: 'upload-toast' });
      }

      // 2. Prepare application data
      const currentValues = form.getValues();
      const typeData = applicationTypes.find(t => t.id === currentValues.type);
      const category = typeData?.category || 'academic';

      const applicationData = {
        ...currentValues,
        documents: uploadedDocs,
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        category: category,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // 3. Save to Firebase at the categorized path
      const applicationRef = ref(database, `applications/${category}`);
      const newRef = await push(applicationRef, applicationData);
      
      // 4. Create notification
      await createApplicationNotification(
        { ...applicationData, id: newRef.key },
        user
      );

      toast.success('Application submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Modal Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">New Application</h2>
          <p className="text-sm text-gray-500">Please fill in the required information</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 focus:outline-none"
          disabled={isSubmitting}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b">
        <div className="flex justify-between">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`flex items-center ${
                step === s.id ? 'text-teal-600' : 'text-gray-500'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  step >= s.id ? 'bg-teal-100 text-teal-600' : 'bg-gray-100'
                }`}
              >
                {s.id}
              </div>
              <span className="text-sm font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4">Application Type</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {applicationTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <div
                          key={type.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            form.watch('type') === type.id
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-teal-200'
                          }`}
                          onClick={() => form.setValue('type', type.id)}
                        >
                          <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center mb-3`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <h4 className="font-medium">{type.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">Category: {type.category}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief subject of your application" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>Priority Level</FormLabel>
                  <div className="grid grid-cols-1 gap-4">
                    {priorityLevels.map((priority) => {
                      const Icon = priority.icon;
                      return (
                        <div
                          key={priority.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            form.watch('priority') === priority.value
                              ? `${priority.borderColor} bg-opacity-10`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => form.setValue('priority', priority.value)}
                        >
                          <div className="flex items-start">
                            <div className={`p-2 rounded-lg ${priority.color} mr-3`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900">{priority.label}</h4>
                                {form.watch('priority') === priority.value && (
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-500">{priority.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide detailed information about your application..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any other relevant details..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <div className="space-y-6">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors duration-200 ease-in-out hover:border-teal-300"
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="flex flex-col items-center text-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      Upload Documents
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Drag and drop your files here, or click to browse
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500 mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Paperclip className="h-4 w-4 mr-2" />
                          Choose Files
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Files</h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-teal-500 mr-2" />
                            <span className="text-sm text-gray-600">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Required Documents
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-teal-500" />
                      Application Form (auto-generated)
                    </li>
                    <li className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-teal-500" />
                      Supporting Documents (Optional)
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    Accepted file types: PDF, Word, Images (JPG, PNG) • Max file size: 5MB
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type={step === steps.length ? "submit" : "button"}
                onClick={step === steps.length ? undefined : handleNext}
                className={form.watch('priority') === 'urgent' ? 'bg-red-600 hover:bg-red-700' : ''}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {step === steps.length ? 'Submitting...' : 'Processing...'}
                  </div>
                ) : (
                  step === steps.length ? 'Submit Application' : 'Next'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ApplicationForm; 