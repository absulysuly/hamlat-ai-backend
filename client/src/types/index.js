// Campaign Platform Type Definitions
// Adapted from Iraq Compass with campaign-specific enhancements

/**
 * @typedef {'en' | 'ar' | 'ku'} Language
 */

/**
 * @typedef {Object} LocalizedString
 * @property {string} en - English text
 * @property {string} ar - Arabic text
 * @property {string} ku - Kurdish text
 */

/**
 * @typedef {Object} Coordinates
 * @property {number} lat - Latitude
 * @property {number} lon - Longitude
 */

/**
 * @typedef {'free' | 'basic' | 'pro' | 'premium'} SubscriptionTier
 */

/**
 * @typedef {'admin' | 'candidate' | 'team_member' | 'volunteer'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} [avatarUrl]
 * @property {UserRole} role
 * @property {boolean} isVerified
 * @property {SubscriptionTier} [subscriptionTier]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Candidate
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} [avatarUrl]
 * @property {string} governorate
 * @property {string} [party]
 * @property {string} position - Parliament, Provincial Council, etc.
 * @property {string} campaignStartDate
 * @property {string} campaignEndDate
 * @property {number} budget
 * @property {number} spent
 * @property {string[]} teamMembers - User IDs
 * @property {SubscriptionTier} subscriptionTier
 * @property {CampaignMetrics} metrics
 */

/**
 * @typedef {'draft' | 'active' | 'paused' | 'completed'} CampaignStatus
 */

/**
 * @typedef {Object} Campaign
 * @property {string} id
 * @property {string} candidateId
 * @property {LocalizedString} name
 * @property {LocalizedString} description
 * @property {string} governorate
 * @property {CampaignStatus} status
 * @property {string} startDate
 * @property {string} endDate
 * @property {number} budget
 * @property {number} spent
 * @property {CampaignMetrics} metrics
 */

/**
 * @typedef {Object} CampaignMetrics
 * @property {number} reach
 * @property {number} engagement
 * @property {number} sentiment - Score from -1 to 1
 * @property {number} followers
 * @property {number} shares
 * @property {number} comments
 * @property {number} positiveComments
 * @property {number} negativeComments
 * @property {number} neutralComments
 */

/**
 * @typedef {'post' | 'video' | 'image' | 'script' | 'story'} ContentType
 */

/**
 * @typedef {'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'all'} Platform
 */

/**
 * @typedef {'pending' | 'approved' | 'rejected' | 'published' | 'scheduled'} ContentStatus
 */

/**
 * @typedef {'positive' | 'neutral' | 'negative'} SentimentType
 */

/**
 * @typedef {Object} AIContent
 * @property {string} id
 * @property {string} candidateId
 * @property {ContentType} type
 * @property {LocalizedString} content
 * @property {Platform} platform
 * @property {ContentStatus} status
 * @property {string} [scheduledDate]
 * @property {SentimentType} sentiment
 * @property {string} [mediaUrl]
 * @property {string[]} [hashtags]
 * @property {string} generatedAt
 * @property {string} [approvedAt]
 * @property {string} [publishedAt]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} SentimentData
 * @property {string} timestamp
 * @property {number} score - Score from -1 to 1
 * @property {number} volume - Number of mentions
 * @property {string[]} topics
 * @property {EmotionScores} emotions
 * @property {string} source
 */

/**
 * @typedef {Object} EmotionScores
 * @property {number} joy
 * @property {number} anger
 * @property {number} fear
 * @property {number} sadness
 * @property {number} surprise
 */

/**
 * @typedef {Object} CompetitorData
 * @property {string} id
 * @property {string} candidateId
 * @property {string} competitorName
 * @property {string} governorate
 * @property {CompetitorMetrics} metrics
 * @property {Post[]} recentPosts
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {string[]} recommendations
 */

/**
 * @typedef {Object} CompetitorMetrics
 * @property {number} followers
 * @property {number} engagement
 * @property {number} postFrequency
 * @property {number} sentiment
 * @property {number} growth
 */

/**
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} content
 * @property {Platform} platform
 * @property {string} publishedAt
 * @property {number} likes
 * @property {number} shares
 * @property {number} comments
 */

/**
 * @typedef {Object} VoterEngagement
 * @property {string} governorate
 * @property {string} district
 * @property {Coordinates} coordinates
 * @property {number} engagement - Score 0-100
 * @property {number} sentiment - Score -1 to 1
 * @property {Demographics} demographics
 * @property {string[]} topIssues
 */

/**
 * @typedef {Object} Demographics
 * @property {Object.<string, number>} ageGroups
 * @property {Object.<string, number>} gender
 * @property {string[]} interests
 */

/**
 * @typedef {'low' | 'medium' | 'high' | 'critical'} AlertSeverity
 */

/**
 * @typedef {'negative_trend' | 'viral_negative' | 'competitor_attack' | 'scandal' | 'budget_exceeded'} AlertType
 */

/**
 * @typedef {'new' | 'acknowledged' | 'responding' | 'resolved'} AlertStatus
 */

/**
 * @typedef {Object} CrisisAlert
 * @property {string} id
 * @property {string} candidateId
 * @property {AlertSeverity} severity
 * @property {AlertType} type
 * @property {string} description
 * @property {string} detectedAt
 * @property {string} source
 * @property {Platform[]} affectedPlatforms
 * @property {string[]} suggestedResponses
 * @property {AlertStatus} status
 */

/**
 * @typedef {Object} GovernorateCampaign
 * @property {string} governorate
 * @property {number} budget
 * @property {number} spent
 * @property {User[]} teamMembers
 * @property {AIContent[]} content
 * @property {CampaignMetrics} metrics
 * @property {VoterEngagement} voterEngagement
 * @property {string[]} priorities
 */

/**
 * @typedef {Object} BroadcastCampaign
 * @property {string} id
 * @property {string} candidateId
 * @property {'sms' | 'whatsapp'} type
 * @property {LocalizedString} message
 * @property {BroadcastRecipient[]} recipients
 * @property {string} scheduledDate
 * @property {BroadcastStatus} status
 * @property {BroadcastMetrics} metrics
 */

/**
 * @typedef {Object} BroadcastRecipient
 * @property {string} phone
 * @property {string} [name]
 * @property {string} [governorate]
 * @property {string} [segment]
 */

/**
 * @typedef {'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'} BroadcastStatus
 */

/**
 * @typedef {Object} BroadcastMetrics
 * @property {number} sent
 * @property {number} delivered
 * @property {number} read
 * @property {number} replied
 * @property {number} failed
 */

/**
 * @typedef {Object} Volunteer
 * @property {string} id
 * @property {string} candidateId
 * @property {string} name
 * @property {string} phone
 * @property {string} email
 * @property {string} governorate
 * @property {string[]} skills
 * @property {Availability} availability
 * @property {Assignment[]} assignments
 * @property {VolunteerPerformance} performance
 */

/**
 * @typedef {Object} Availability
 * @property {string[]} days
 * @property {string} hours
 */

/**
 * @typedef {Object} Assignment
 * @property {string} taskId
 * @property {'door_to_door' | 'event' | 'social_media' | 'phone_banking'} taskType
 * @property {string} date
 * @property {'assigned' | 'in_progress' | 'completed'} status
 */

/**
 * @typedef {Object} VolunteerPerformance
 * @property {number} tasksCompleted
 * @property {number} rating
 * @property {number} hoursContributed
 */

/**
 * @typedef {Object} Mention
 * @property {string} id
 * @property {string} candidateId
 * @property {string} author
 * @property {string} content
 * @property {Platform} platform
 * @property {SentimentType} sentiment
 * @property {string} timestamp
 * @property {boolean} isRead
 * @property {string} [response]
 * @property {string} url
 */

/**
 * @typedef {Object} Governorate
 * @property {string} id
 * @property {LocalizedString} name
 * @property {number} population
 * @property {Coordinates} [coordinates]
 */

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} contentApproval
 * @property {boolean} sentimentAlerts
 * @property {boolean} competitorAlerts
 * @property {boolean} campaignMilestones
 * @property {boolean} budgetAlerts
 * @property {boolean} teamActivity
 * @property {boolean} systemUpdates
 */

/**
 * @typedef {Object} AnalyticsDateRange
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} totalReach
 * @property {number} totalEngagement
 * @property {number} followers
 * @property {number} sentiment
 * @property {number} contentGenerated
 * @property {number} contentPublished
 * @property {number} budgetSpent
 * @property {number} budgetRemaining
 */

export {};
