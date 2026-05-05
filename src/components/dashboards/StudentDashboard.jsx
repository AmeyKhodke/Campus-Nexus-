import React, { useState, useEffect } from 'react';
import { firebaseAuthService } from '../../services/firebaseAuth.service';
import { getDatabase, ref, get, query, orderByChild, equalTo, onValue, update } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Calendar, FileText, Users, Bell, BarChart3, Vote, DollarSign, ClipboardList, 
  MessageSquare, PlusCircle, PieChart as PieChartIcon, ChevronDown, X, CheckCircle, 
  ArrowRight, Book, Award, Loader2, Search, ArrowUp, ArrowDown, Check, Eye
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import { toast } from 'react-hot-toast';

// Constants for chart colors
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']; // Blue, Green, Amber, Red, Purple, Cyan

// Map actions to icons for Visuals Section Title
const actionToVisualMap = {
  election: <Vote className="h-5 w-5 mr-2 text-blue-600" />,
  budget: <DollarSign className="h-5 w-5 mr-2 text-green-600" />,
  facility: <Calendar className="h-5 w-5 mr-2 text-purple-600" />,
  application: <FileText className="h-5 w-5 mr-2 text-amber-600" />,
  feedback: <MessageSquare className="h-5 w-5 mr-2 text-rose-600" />,
  report: <BarChart3 className="h-5 w-5 mr-2 text-cyan-600" />,
};

// Utility function for notification icons (without margins)
const getNotificationIcon = (actionType) => {
  const commonClass = "h-5 w-5";
  switch(actionType) {
    case 'election': return <Vote className={`${commonClass} text-blue-700`} />;
    case 'budget': return <DollarSign className={`${commonClass} text-green-700`} />;
    case 'facility': return <Calendar className={`${commonClass} text-purple-700`} />;
    case 'application': return <FileText className={`${commonClass} text-amber-700`} />;
    case 'feedback': return <MessageSquare className={`${commonClass} text-rose-700`} />;
    case 'report': return <BarChart3 className={`${commonClass} text-cyan-700`} />;
    default: return <Bell className={`${commonClass} text-gray-700`} />;
  }
};

// Utility functions moved outside components
const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'normal':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'academic':
      return <Book className="h-5 w-5 text-blue-600" />;
    case 'event':
      return <Calendar className="h-5 w-5 text-green-600" />;
    case 'meeting':
      return <Users className="h-5 w-5 text-purple-600" />;
    case 'research':
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <Bell className="h-5 w-5 text-gray-600" />;
  }
};

const formatDate = (date) => {
  const now = new Date();
  const announcementDate = new Date(date);
  const diffTime = Math.abs(now - announcementDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  
  return announcementDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Custom Recharts Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 shadow-lg rounded-lg border border-gray-200/50">
        <p className="label text-sm font-bold text-gray-800 mb-1">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.stroke }} className="text-xs flex items-center">
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color || entry.stroke }}></span>
            {`${entry.name}: ${entry.value.toLocaleString()}${entry.unit || ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const StudentDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedVisual, setSelectedVisual] = useState('');
  const [activeAction, setActiveAction] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [dashboardData, setDashboardData] = useState({
    electionData: [],
    budgetTrends: [],
    facilityUsage: [],
    applicationStats: [],
    feedbackMetrics: [],
    reportData: []
  });
  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [readAnnouncements, setReadAnnouncements] = useState({});
  const [user] = useAuthState(auth);

  useEffect(() => {
    const isMounted = { current: true };
    const database = getDatabase();

    const fetchUserData = async () => {
      try {
        const currentUser = await firebaseAuthService.getCurrentUser();
        if (!currentUser || !isMounted.current) return;

        const userProfile = currentUser.userProfile;
        if (!userProfile) {
          console.error('No user profile found');
          if (isMounted.current) setIsLoading(false); // Stop loading if no profile
          return;
        }

        const name = `${userProfile.firstname} ${userProfile.lastname}`;
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

        setUserData({
          name: name,
          initials: initials,
          title: 'Student',
          department: userProfile.department || 'Not Assigned',
          year: userProfile.year || '1st Year',
          studentId: userProfile.studentID,
          avatar: userProfile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
        });

        const studentId = userProfile.studentID;
        
        const electionRef = ref(database, `elections/participants/${studentId}`);
        const budgetRef = query(ref(database, 'budget_requests'), orderByChild('studentId'), equalTo(studentId));
        const facilityRef = query(ref(database, 'facility_bookings'), orderByChild('studentId'), equalTo(studentId));
        const applicationRef = query(ref(database, 'applications'), orderByChild('studentId'), equalTo(studentId));
        const feedbackRef = query(ref(database, 'feedback'), orderByChild('studentId'), equalTo(studentId));

        const [
          electionSnapshot,
          budgetSnapshot,
          facilitySnapshot,
          applicationSnapshot,
          feedbackSnapshot
        ] = await Promise.all([
          get(electionRef),
          get(budgetRef),
          get(facilityRef),
          get(applicationRef),
          get(feedbackRef)
        ]);

        const electionData = electionSnapshot.exists() ? electionSnapshot.val() : [];
        const budgetData = budgetSnapshot.exists() ? Object.values(budgetSnapshot.val()) : [];
        const facilityData = facilitySnapshot.exists() ? Object.values(facilitySnapshot.val()) : [];
        const applicationData = applicationSnapshot.exists() ? Object.values(applicationSnapshot.val()) : [];
        const feedbackData = feedbackSnapshot.exists() ? Object.values(feedbackSnapshot.val()) : [];

        const processedData = {
          electionData: processElectionData(electionData),
          budgetTrends: processBudgetData(budgetData),
          facilityUsage: processFacilityData(facilityData),
          applicationStats: processApplicationData(applicationData),
          feedbackMetrics: processFeedbackData(feedbackData),
          reportData: processReportData(applicationData, feedbackData)
        };

        if (isMounted.current) {
          setDashboardData(processedData);
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    const announcementsRef = ref(database, 'announcements');
    const unsubscribeAnnouncements = onValue(announcementsRef, (snapshot) => {
      if (snapshot.exists()) {
        const announcementsData = [];
        snapshot.forEach((childSnapshot) => {
          announcementsData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        announcementsData.sort((a, b) => new Date(b.date) - new Date(a.date));
        if(isMounted.current) setAnnouncements(announcementsData);
      }
      if(isMounted.current) setIsLoadingAnnouncements(false);
    }, (error) => {
      console.error("Error fetching announcements:", error);
      if(isMounted.current) setIsLoadingAnnouncements(false);
    });

    return () => {
      isMounted.current = false;
      unsubscribeAnnouncements();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const database = getDatabase();
    const readStatusRef = ref(database, `announcementReads/${user.uid}`);
    
    const unsubscribe = onValue(readStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        setReadAnnouncements(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Add real-time notification listener
  useEffect(() => {
    if (!user) return;

    const database = getDatabase();
    const notificationsRef = ref(database, `notifications/users/${user.uid}`);
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const notificationsData = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          notificationsData.push({
            id: childSnapshot.key,
            ...data,
            // Map Firebase data to dashboard format
            time: formatDate(data.createdAt || Date.now()),
            icon: getNotificationIcon(data.type?.split('_')[0] || 'default'),
            color: getColorForAction(data.type?.split('_')[0] || 'default')
          });
        });

        // Sort by newest first and limit to 5
        notificationsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setNotifications(notificationsData.slice(0, 5));
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Data processing helper functions (minor changes for robustness if any)
  const processElectionData = (data) => {
    if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0) ) { // Handle empty object from Firebase
      return [{ name: 'No Elections', votes: 0, eligible: 0, turnout: 0 }];
    }
    // If data is an object (from participant/{studentId}), convert to array of one item
    const electionArray = Array.isArray(data) ? data : [data]; 
    return electionArray.map(election => ({
      name: election.electionName || 'Unknown Election',
      votes: election.hasVoted ? 1 : 0,
      eligible: 1,
      turnout: election.hasVoted ? 100 : 0
    }));
  };

  const processBudgetData = (data) => {
    if (!data || data.length === 0) {
      return [{ month: 'No Data', requested: 0, approved: 0, allocated: 0 }];
    }
    return data.map(request => ({
      month: new Date(request.timestamp).toLocaleString('default', { month: 'short' }),
      requested: request.amount || 0,
      approved: request.status === 'approved' ? (request.amount || 0) : 0,
      allocated: request.status === 'approved' ? (request.allocatedAmount || request.amount || 0) : 0
    }));
  };

  const processFacilityData = (data) => {
    if (!data || data.length === 0) {
      return [{ facility: 'No Bookings', usage: 0, capacity: 0, events: 0 }];
    }
    const facilityMap = data.reduce((acc, booking) => {
      const facilityName = booking.facilityName || 'Unknown Facility';
      if (!acc[facilityName]) {
        acc[facilityName] = { facility: facilityName, usage: 0, capacity: booking.capacity || 50, events: 0 };
      }
      // Assuming usage is a percentage representing occupation based on duration/capacity or fixed events
      // For simplicity, let's use a fixed value or derive one if more info available.
      // Here, using number of events for 'usage' in the chart
      acc[facilityName].usage += 1; // Counting bookings as usage points
      acc[facilityName].events += 1;
      return acc;
    }, {});
    return Object.values(facilityMap);
  };

  const processApplicationData = (data) => {
    if (!data || data.length === 0) {
      return [{ type: 'No Apps', pending: 0, approved: 0, rejected: 0 }];
    }
    const typeMap = data.reduce((acc, app) => {
      const appType = app.type || 'General';
      if (!acc[appType]) {
        acc[appType] = { type: appType, pending: 0, approved: 0, rejected: 0 };
      }
      if (app.status) {
        acc[appType][app.status.toLowerCase()] = (acc[appType][app.status.toLowerCase()] || 0) + 1;
      } else {
        acc[appType]['pending'] = (acc[appType]['pending'] || 0) + 1; // Default to pending if status undefined
      }
      return acc;
    }, {});
    return Object.values(typeMap);
  };

  const processFeedbackData = (data) => {
    if (!data || data.length === 0) {
      return [{ category: 'No Feedback', score: 0, responses: 0, name: 'No Feedback' }]; // Added name for RadialBarChart
    }
    const categoryMap = data.reduce((acc, feedback) => {
      const category = feedback.category || 'General';
      if (!acc[category]) {
        acc[category] = { category: category, name: category, totalScore: 0, count: 0 };
      }
      acc[category].totalScore += (feedback.rating || 0);
      acc[category].count++;
      return acc;
    }, {});
    return Object.values(categoryMap).map(item => ({
      category: item.category,
      name: item.name, // For RadialBarChart dataKey
      score: item.count > 0 ? parseFloat((item.totalScore / item.count).toFixed(1)) : 0,
      responses: item.count
    }));
  };

  const processReportData = (applications, feedback) => {
    if ((!applications || applications.length === 0) && (!feedback || feedback.length === 0)) {
      return [{ name: 'No Data', academic: 0, administrative: 0, facilities: 0 }];
    }
    const monthlyData = {};
    const allData = [...(applications || []), ...(feedback || [])].filter(item => item.timestamp); // Ensure timestamp exists
    
    allData.forEach(item => {
      const month = new Date(item.timestamp).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthlyData[month]) {
        monthlyData[month] = { name: month, academic: 0, administrative: 0, facilities: 0 };
      }
      const type = item.type || item.category; // Use 'type' from applications, 'category' from feedback
      if (['academic', 'course', 'lecture'].includes(type?.toLowerCase())) {
        monthlyData[month].academic++;
      } else if (['administrative', 'office', 'support'].includes(type?.toLowerCase())) {
        monthlyData[month].administrative++;
      } else if (['facility', 'lab', 'library'].includes(type?.toLowerCase())) {
        monthlyData[month].facilities++;
      }
    });
    
    return Object.values(monthlyData).sort((a,b) => new Date('1 ' + a.name.split(' ')[0] + ' 20' + a.name.split(' ')[1]) - new Date('1 ' + b.name.split(' ')[0] + ' 20' + b.name.split(' ')[1]));
  };


  const handleQuickAction = (actionType) => {
    setActiveAction(actionType);
    setSelectedVisual(actionType); // Assuming actionType directly maps to visual type
    setTimeout(() => {
      document.getElementById('visuals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100); // Reduced delay
  };

  const handleSubmitAction = () => {
    const message = `Your ${activeAction} has been submitted successfully!`;
    setNotificationMessage(message);
    setShowNotification(true);
    
    setTimeout(() => setShowNotification(false), 3000);
    
    const newNotification = {
      id: Date.now(), // Use timestamp for unique ID
      type: activeAction,
      title: `New ${activeAction.charAt(0).toUpperCase() + activeAction.slice(1)} Submitted`,
      message: `Your ${activeAction} request has been submitted and is pending review.`,
      time: 'Just now',
      icon: getNotificationIcon(activeAction), // Use dedicated icon getter
      color: getColorForAction(activeAction)
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep last 5 notifications
  };
  
  const getColorForAction = (action) => {
    switch(action) {
      case 'election': return 'blue';
      case 'budget': return 'green';
      case 'facility': return 'purple';
      case 'application': return 'amber';
      case 'feedback': return 'rose';
      case 'report': return 'cyan';
      default: return 'gray';
    }
  };

  const handleNotificationClick = (type) => {
    if (!type) return;
    setActiveAction(type);
    setSelectedVisual(type);
    setTimeout(() => {
      document.getElementById('visuals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const MetricCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card className={`rounded-xl shadow-lg border-l-4 border-${color}-500 flex flex-col items-center justify-center text-center h-full transition-all duration-300 hover:shadow-xl hover:scale-105 transform`}> 
      <CardContent className="p-6 flex flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center justify-center mb-2">
          <div className={`p-3 rounded-full bg-${color}-100 mb-3 flex items-center justify-center shadow-sm`}>{icon}</div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-extrabold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {trend !== undefined && (
          <div className="flex items-center justify-center mt-2">
            <span className={`text-sm font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              {trend >= 0 ? <ArrowUp className="h-4 w-4 mr-0.5" /> : <ArrowDown className="h-4 w-4 mr-0.5" />}
              {trend >= 0 ? '+' : ''}{trend}% vs last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const AnnouncementDetailsModal = ({ announcement, isOpen, onClose }) => {
    if (!announcement) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-${getUrgencyColor(announcement.urgency).split(' ')[0]}`}> {/* Use base color for icon bg */}
                {getCategoryIcon(announcement.category)}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-800">{announcement.title}</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Posted on {new Date(announcement.date).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })} by <span className="font-medium text-gray-700">{announcement.author || 'Admin'}</span>
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <Badge className={getUrgencyColor(announcement.urgency)}>
                {announcement.urgency.charAt(0).toUpperCase() + announcement.urgency.slice(1)} Priority
              </Badge>
              <Badge variant="outline" className="border-gray-300 text-gray-600">
                Category: {announcement.category.charAt(0).toUpperCase() + announcement.category.slice(1)}
              </Badge>
            </div>
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed">
              <p className="whitespace-pre-wrap">{announcement.content}</p>
            </div>
            {announcement.attachmentURL && announcement.attachmentName && ( // Check for URL too
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-base font-semibold text-gray-900 mb-2">Attachment</h4>
                <a 
                  href={announcement.attachmentURL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  <span>{announcement.attachmentName}</span>
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const AnnouncementCard = ({ announcement, onMarkAsRead, isRead }) => {
    const [showDetails, setShowDetails] = useState(false);

    const handleMarkAsRead = (e) => {
      e.stopPropagation(); // Prevent opening the details modal
      onMarkAsRead(announcement.id);
    };

    return (
      <>
        <Card 
          className={`hover:shadow-lg transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-300/70 overflow-hidden ${!isRead ? 'bg-blue-50/30' : ''}`}
          onClick={() => {
            setShowDetails(true);
            if (!isRead) {
              onMarkAsRead(announcement.id);
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2.5 rounded-lg bg-gray-100 flex-shrink-0 mt-1`}>
                  {getCategoryIcon(announcement.category)}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-1 text-base">{announcement.title}</h3>
                    {!isRead && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(announcement.date)} {announcement.author && `by ${announcement.author}`}
                  </p>
                  <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                <Badge className={`${getUrgencyColor(announcement.urgency)} text-xs px-1.5 py-0.5`}>
                  {announcement.urgency.charAt(0).toUpperCase() + announcement.urgency.slice(1)}
                </Badge>
                {announcement.attachmentName && (
                  <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>Attachment</span>
                  </div>
                )}
                {isRead ? (
                  <div className="flex items-center text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                    <Check className="h-3 w-3 mr-1" />
                    <span>Read</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={handleMarkAsRead}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Mark as read</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <AnnouncementDetailsModal
          announcement={announcement}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
        />
      </>
    );
  };

  const AnnouncementsSection = () => {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [readAnnouncements, setReadAnnouncements] = useState({});
    const [user] = useAuthState(auth);

    useEffect(() => {
      if (!user) return;

      const database = getDatabase();
      const readStatusRef = ref(database, `announcementReads/${user.uid}`);
      
      const unsubscribe = onValue(readStatusRef, (snapshot) => {
        if (snapshot.exists()) {
          setReadAnnouncements(snapshot.val());
        }
      });

      return () => unsubscribe();
    }, [user]);

    const handleMarkAsRead = async (announcementId) => {
      if (!user) return;

      const database = getDatabase();
      const updates = {};
      
      const announcement = announcements.find(a => a.id === announcementId);
      const currentViews = announcement?.views || 0;
      const currentReadCount = announcement?.readCount || 0;
      
      // Update read status for the user
      updates[`announcementReads/${user.uid}/${announcementId}`] = {
        readAt: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Anonymous'
      };
      
      // Update both readCount and views in the announcement
      updates[`announcements/${announcementId}/readCount`] = currentReadCount + 1;
      updates[`announcements/${announcementId}/views`] = currentViews + 1;
      
      try {
        await update(ref(database), updates);
        toast.success('Marked as read');
      } catch (error) {
        console.error('Error marking announcement as read:', error);
        toast.error('Failed to mark announcement as read');
      }
    };

    const filteredAnnouncements = announcements.filter(announcement => {
      const matchesFilter = filter === 'all' || announcement.category === filter;
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = announcement.title.toLowerCase().includes(lowerSearchTerm) ||
                           announcement.content.toLowerCase().includes(lowerSearchTerm) ||
                           (announcement.author && announcement.author.toLowerCase().includes(lowerSearchTerm));
      return matchesFilter && matchesSearch;
    }).slice(0, 5);

    return (
      <Card className="shadow-md transition-all duration-300 hover:shadow-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <Bell className="h-6 w-6 text-blue-600" />
                Latest Announcements
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {announcements.length > 0 
                  ? `${announcements.filter(a => !readAnnouncements[a.id]).length} unread of ${announcements.length} total`
                  : 'No announcements yet'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48 transition-all"
                />
              </div>
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none w-full sm:w-auto px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                >
                  <option value="all">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="event">Events</option>
                  <option value="meeting">Meetings</option>
                  <option value="research">Research</option>
                  <option value="general">General</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6">
          {isLoadingAnnouncements ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[90px] w-full rounded-lg" />)}
            </div>
          ) : filteredAnnouncements.length > 0 ? (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <AnnouncementCard 
                  key={announcement.id} 
                  announcement={announcement}
                  onMarkAsRead={handleMarkAsRead}
                  isRead={!!readAnnouncements[announcement.id]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 mx-auto text-gray-300 mb-6" />
              <p className="text-gray-700 font-semibold text-lg">No Announcements Found</p>
              <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                {searchTerm 
                  ? "Try adjusting your search or filter terms. No announcements match your current criteria."
                  : filter !== 'all'
                  ? `There are no announcements in the '${filter}' category at the moment.`
                  : "It's all quiet on the announcement front! Check back later for updates."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-700 text-lg font-medium">Loading Your Dashboard...</p>
          <p className="text-gray-500 text-sm">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-center p-8 bg-white shadow-xl rounded-lg">
          <Users className="h-16 w-16 mx-auto text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">User Data Not Available</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't load your profile information. This might be a temporary issue.
            Please try logging out and logging back in. If the problem persists, contact support.
          </p>
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => firebaseAuthService.logout()}>
            Logout and Try Again
          </Button>
        </div>
      </div>
    );
  }

  const QuickActionButton = ({ action, icon, label }) => {
    const color = getColorForAction(action);
    const isActive = activeAction === action;
  return (
      <Button 
        variant="outline" 
        className={`h-28 flex flex-col items-center justify-center gap-2.5 p-3 text-center
                    transition-all duration-300 ease-in-out transform hover:scale-105 
                    focus:ring-2 focus:ring-offset-1
                    ${isActive 
                      ? `bg-${color}-50 border-${color}-500 ring-2 ring-${color}-300 text-${color}-700 shadow-md` 
                      : `border-gray-200 hover:bg-${color}-50 hover:border-${color}-300 text-gray-600 hover:text-${color}-700`}`}
        onClick={() => handleQuickAction(action)}
      >
        {React.cloneElement(icon, { className: `h-8 w-8 transition-colors ${isActive ? `text-${color}-600` : `text-gray-500 group-hover:text-${color}-600`}` })}
        <span className={`text-xs sm:text-sm font-medium transition-colors ${isActive ? `text-${color}-700` : 'text-gray-700'}`}>{label}</span>
      </Button>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-4 md:p-6">
      {showNotification && (
        <div className="fixed top-5 right-5 z-[100] bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-xl flex items-start max-w-md animate-in slide-in-from-top duration-500">
          <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-green-800">Success!</h4>
            <p className="text-sm">{notificationMessage}</p>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-green-500 hover:text-green-700 transition-colors ml-4">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="max-w-8xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600 transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-blue-200 shadow-md">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="bg-blue-500 text-white font-semibold text-2xl">{userData.initials}</AvatarFallback>
                </Avatar>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  Welcome back, {userData.name.split(' ')[0]}!
                </h1>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-600 mt-1.5 text-sm">
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-blue-500" />{userData.title}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5"><Book className="h-4 w-4 text-green-500" />{userData.department}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-amber-500" />{userData.year}</span>
                </div>
                 <p className="text-xs text-gray-500 mt-1">Student ID: {userData.studentId}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="appearance-none w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                >
                  <option value="daily">Daily View</option>
                  <option value="weekly">Weekly View</option>
                  <option value="monthly">Monthly View</option>
                  <option value="yearly">Yearly View</option>
                  </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              <Button className="bg-blue-600 hover:bg-blue-700 transition-all w-full sm:w-auto py-2.5">
                <FileText className="h-4 w-4 mr-2" />
                View Full Reports
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard title="Active Elections" value={dashboardData.electionData.filter(e => e.name !== 'No Elections').length} subtitle="Your participation matters" icon={<Vote className="h-7 w-7 text-blue-600" />} color="blue" trend={12}/>
          <MetricCard title="Budget Usage" value="$1.85M" subtitle="$15K student funds available" icon={<DollarSign className="h-7 w-7 text-green-600" />} color="green" trend={5.2}/>
          <MetricCard title="My Applications" value={dashboardData.applicationStats.reduce((sum, app) => sum + app.pending + app.approved + app.rejected, 0)} subtitle="Track your submissions" icon={<ClipboardList className="h-7 w-7 text-amber-600" />} color="amber" trend={-3}/>
          <MetricCard title="Feedback Sent" value={dashboardData.feedbackMetrics.reduce((sum, fb) => sum + fb.responses, 0)} subtitle="Make your voice heard" icon={<MessageSquare className="h-7 w-7 text-purple-600" />} color="purple" trend={7}/>
        </div>

        <Card className="shadow-md transition-all duration-300 hover:shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <PlusCircle className="h-6 w-6 text-blue-600" />
              Quick Actions
            </CardTitle>
             <p className="text-sm text-gray-500">Access common tasks quickly.</p>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <QuickActionButton action="election" icon={<Vote />} label="View Elections" />
              <QuickActionButton action="budget" icon={<DollarSign />} label="Budget Request" />
              <QuickActionButton action="facility" icon={<Calendar />} label="Book Facility" />
              <QuickActionButton action="application" icon={<FileText />} label="New Application" />
              <QuickActionButton action="feedback" icon={<MessageSquare />} label="Send Feedback" />
              <QuickActionButton action="report" icon={<BarChart3 />} label="Generate Report" />
            </div>
          </CardContent>
        </Card>

        <div id="visuals-section" className="bg-white rounded-xl shadow-lg p-4 md:p-6 mt-6 transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              {selectedVisual && activeAction && actionToVisualMap[activeAction] ? (
                <>
                  {actionToVisualMap[activeAction]}
                  {activeAction.charAt(0).toUpperCase() + activeAction.slice(1)} Analytics
                </>
              ) : (
                <>
                  <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
                  Dashboard Analytics
                </>
              )}
            </h2>
            {selectedVisual && (
              <Badge variant="outline" className={`border-${getColorForAction(activeAction)}-500 text-${getColorForAction(activeAction)}-700 bg-${getColorForAction(activeAction)}-50 text-sm px-3 py-1`}>
                {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} View
              </Badge>
            )}
          </div>
          
          {!selectedVisual && (
            <div className="flex flex-col items-center justify-center p-10 sm:p-16 text-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg">
              <BarChart3 className="h-16 w-16 text-blue-500 mb-6 opacity-80" />
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">Explore Your Data</h3>
              <p className="text-gray-600 max-w-lg leading-relaxed">
                Choose a <strong className="text-blue-600 font-semibold">Quick Action</strong> from the panel above to dive into specific analytics, visualize trends, and manage your activities.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                For instance, click on 'View Elections' to see election-related charts and information.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedVisual === 'election' && (
              <>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Vote className="h-5 w-5 text-blue-600" />Election Participation</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dashboardData.electionData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="turnout" name="Turnout %" fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-blue-600" />Your Voting Status</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPieChart>
                        <Pie data={dashboardData.electionData.length > 0 && dashboardData.electionData[0].name !== 'No Elections' ? [{name: 'Voted', value: dashboardData.electionData.reduce((acc,curr) => acc + curr.votes,0)}, {name: 'Not Voted', value: dashboardData.electionData.reduce((acc,curr) => acc + (curr.eligible - curr.votes) ,0)}] : [{name: 'No Data', value:1}]} dataKey="value" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {(dashboardData.electionData.length > 0 && dashboardData.electionData[0].name !== 'No Elections' ? [{name: 'Voted', value: dashboardData.electionData.reduce((acc,curr) => acc + curr.votes,0)}, {name: 'Not Voted', value: dashboardData.electionData.reduce((acc,curr) => acc + (curr.eligible - curr.votes) ,0)}] : [{name: 'No Data', value:1}]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? COLORS[1] : COLORS[3]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                     <div className="mt-4 text-sm text-gray-600">Status for elections you are eligible for.</div>
                  </CardContent>
                </Card>
              </>
            )}
            
            {selectedVisual === 'budget' && (
              <>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" />My Budget Requests</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={dashboardData.budgetTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip content={<CustomTooltip />} unit="$" />
                        <Area type="monotone" dataKey="requested" name="Requested" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} strokeWidth={2} />
                        <Area type="monotone" dataKey="approved" name="Approved" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.2} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                   <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-green-600" />Department Budget Allocation</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4 pt-2">
                      {/* Static example data, replace with dynamic if available */}
                      {[ { name: "Academic Programs", value: 45, color: "green" }, { name: "Research Projects", value: 25, color: "blue" }, { name: "Student Activities", value: 20, color: "amber" }, { name: "Admin Support", value: 10, color: "purple" } ].map(item => (
                        <div key={item.name}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            <span className={`text-sm font-semibold text-${item.color}-600`}>{item.value}%</span>
                        </div>
                          <Progress value={item.value} className={`h-2.5 bg-${item.color}-100 rounded-full`} indicatorClassName={`bg-${item.color}-500 rounded-full`} />
                      </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            
            {selectedVisual === 'facility' && (
              <>
                  <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" />My Facility Bookings (Count)</CardTitle></CardHeader>
                  <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dashboardData.facilityUsage} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 'dataMax + 2']} fontSize={12} />
                          <YAxis dataKey="facility" type="category" width={120} fontSize={12} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="events" name="Bookings" fill={COLORS[4]} radius={[0, 4, 4, 0]} barSize={20}>
                          {dashboardData.facilityUsage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                  <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" />Upcoming Bookings (Example)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                        {/* Replace with dynamic data if available */}
                        {[
                          { facility: "Auditorium", time: "Tomorrow, 2 PM - 4 PM", status: "Confirmed", iconColor: "purple" },
                          { facility: "Comp Lab 2", time: "May 22, 10 AM - 12 PM", status: "Pending", iconColor: "blue" },
                          { facility: "Seminar Room 3", time: "May 25, 1 PM - 3 PM", status: "Confirmed", iconColor: "amber" },
                        ].map((booking, idx) => (
                          <div key={idx} className={`flex items-center p-3 bg-${booking.iconColor}-50 rounded-lg gap-3 border-l-4 border-${booking.iconColor}-400`}>
                            <div className={`bg-${booking.iconColor}-100 p-2.5 rounded-full`}> <Book className={`h-5 w-5 text-${booking.iconColor}-600`} /> </div>
                        <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">{booking.facility}</p>
                              <p className="text-xs text-gray-500">{booking.time}</p>
                        </div>
                            <Badge className={`text-xs ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{booking.status}</Badge>
                      </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            
            {selectedVisual === 'application' && (
              <>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5 text-amber-600" />My Application Status</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dashboardData.applicationStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        <Bar dataKey="pending" name="Pending" stackId="a" fill={COLORS[2]} radius={[4,4,0,0]} />
                        <Bar dataKey="approved" name="Approved" stackId="a" fill={COLORS[1]} />
                        <Bar dataKey="rejected" name="Rejected" stackId="a" fill={COLORS[3]} radius={[0,0,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5 text-amber-600" />Recent Applications (Example)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { title: "Tech Scholarship", date: "May 12, 2025", status: "Under Review", iconColor: "amber" },
                        { title: "Study Abroad Program", date: "Apr 29, 2025", status: "Approved", iconColor: "green" },
                        { title: "Research Grant - AI", date: "May 5, 2025", status: "Under Review", iconColor: "purple" },
                      ].map((app, idx) => (
                        <div key={idx} className={`flex items-center p-3 bg-${app.iconColor}-50 rounded-lg gap-3 border-l-4 border-${app.iconColor}-400`}>
                          <div className={`bg-${app.iconColor}-100 p-2.5 rounded-full`}> <Award className={`h-5 w-5 text-${app.iconColor}-600`} /> </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm">{app.title}</p>
                            <p className="text-xs text-gray-500">Submitted on {app.date}</p>
                        </div>
                          <Badge className={`text-xs ${app.status === 'Approved' ? 'bg-green-100 text-green-800' : app.status === 'Under Review' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{app.status}</Badge>
                      </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            
            {selectedVisual === 'feedback' && (
              <>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5 text-rose-600" />Average Feedback Scores</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                       <RadialBarChart 
                        cx="50%" cy="55%" innerRadius="25%" outerRadius="100%" 
                        barSize={15} data={dashboardData.feedbackMetrics.filter(f => f.score > 0)} startAngle={180} endAngle={0}>
                        <RadialBar 
                          minAngle={15} 
                          label={{ position: 'insideStart', fill: '#fff', fontSize: '10px' }} 
                          background={{ fill: '#f0f0f0' }}
                          clockWise 
                          dataKey="score" 
                        >
                          {dashboardData.feedbackMetrics.filter(f => f.score > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </RadialBar>
                        <Legend iconSize={10} wrapperStyle={{fontSize: "12px", bottom: -5, left: '50%', transform: 'translateX(-50%)'}} layout="horizontal" verticalAlign="bottom" />
                        <Tooltip content={<CustomTooltip />} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5 text-rose-600" />Recent Feedback (Example)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                      {[
                        { title: "CS 301 Course", rating: 4, comment: "Great materials, more exercises needed.", date: "May 15", color: "rose"},
                        { title: "Library Services", rating: 5, comment: "Extended hours were helpful!", date: "May 10", color: "blue"},
                        { title: "Campus Food", rating: 3, comment: "More vegetarian options, please.", date: "May 8", color: "green"},
                      ].map((fb, idx) => (
                        <div key={idx} className={`p-3.5 bg-${fb.color}-50 rounded-lg border-l-4 border-${fb.color}-400`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-semibold text-sm text-${fb.color}-900`}>{fb.title}</p>
                          <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-lg ${i < fb.rating ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                        </div>
                          <p className={`text-xs text-${fb.color}-700`}>"{fb.comment}"</p>
                          <p className="text-xs text-gray-400 mt-1.5 text-right">Sent on {fb.date}</p>
                      </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            
            {selectedVisual === 'report' && (
              <>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-cyan-600" />Monthly Activity Report</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={dashboardData.reportData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        <Area type="monotone" dataKey="academic" name="Academic" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} />
                        <Area type="monotone" dataKey="administrative" name="Admin" stackId="1" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.3} />
                        <Area type="monotone" dataKey="facilities" name="Facilities" stackId="1" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-cyan-600" />Report Templates (Example)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                       {[
                        { title: "Academic Progress", desc: "Course performance, achievements.", iconColor: "cyan"},
                        { title: "Budget Expenditure", desc: "Tracks spending and allocation.", iconColor: "cyan"},
                        { title: "Event Attendance", desc: "Participation metrics.", iconColor: "cyan"},
                      ].map((template, idx) => (
                        <div key={idx} className="flex items-center p-3.5 border border-gray-200 rounded-lg hover:bg-cyan-50 hover:border-cyan-300 transition-colors cursor-pointer group">
                          <div className={`bg-cyan-100 p-2.5 mr-3 rounded-full transition-colors group-hover:bg-cyan-200`}>
                            <FileText className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm">{template.title} Report</p>
                            <p className="text-xs text-gray-500">{template.desc}</p>
                        </div>
                          <Button size="sm" variant="outline" className="text-cyan-600 border-cyan-300 hover:bg-cyan-100 hover:text-cyan-700 h-8 px-3">
                          Use
                        </Button>
                      </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnnouncementsSection />
          </div>
          <Card className="shadow-md transition-all duration-300 hover:shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                <Bell className="h-6 w-6 text-blue-600" />
              Recent Notifications
            </CardTitle>
              <p className="text-sm text-gray-500">Key updates and alerts for you.</p>
          </CardHeader>
            <CardContent className="p-4 md:p-6">
              {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                      className={`flex items-start gap-3 p-3.5 border-l-4 border-${notification.color}-500 bg-${notification.color}-50 rounded-r-lg cursor-pointer transition-all duration-300 ease-in-out hover:bg-${notification.color}-100 hover:shadow-md transform hover:scale-[1.01]`}
                  onClick={() => handleNotificationClick(notification.type)}
                >
                      <div className={`p-2 bg-${notification.color}-100 rounded-full mt-0.5 shadow-sm`}>
                    {notification.icon}
                  </div>
                  <div className="flex-1">
                        <p className={`font-semibold text-sm text-${notification.color}-800`}>{notification.title}</p>
                        <p className={`text-xs text-${notification.color}-700`}>{notification.message}</p>
                        <p className={`text-xs text-${notification.color}-500 mt-1`}>{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 font-medium">No new notifications</p>
                  <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
                </div>
              )}
              {notifications.length > 0 && (
                <div className="mt-6 text-center">
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm">
                <Bell className="h-4 w-4 mr-2" />
                View All Notifications
              </Button>
            </div>
              )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;