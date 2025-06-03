# 📦 Product Review and Rating System

This document describes the implementation of the Product Review and Rating system. It allows users to rate and review products, tracks helpfulness votes, ensures reviews are linked to verified purchases, and provides analytics for merchant insights.

---

## 📌 Features

- One review per product per user
- Verified purchase check before review submission
- Star rating (1–5) with optional title and content
- Moderation system (automatic + admin override)
- Helpfulness voting
- Aggregated product rating and distribution
- Review analytics: average, distribution, trends

---

## 📐 Entities

### `Review`
| Field               | Description                             |
|--------------------|-----------------------------------------|
| `id`               | Primary key                             |
| `productId`        | FK to Product                           |
| `userId`           | FK to User                              |
| `rating`           | Integer (1–5)                           |
| `title`            | Short review title                      |
| `content`          | Main review body                        |
| `status`           | `pending`, `approved`, `rejected`, `flagged` |
| `isVerifiedPurchase` | True if user purchased the product     |
| `helpfulVotes`     | Number of helpful votes                 |
| `totalVotes`       | Total helpful/unhelpful votes           |
| `moderatorNotes`   | Admin notes                             |
| `moderatedAt`      | Moderation timestamp                    |

### `ReviewVote`
| Field       | Description                 |
|------------|-----------------------------|
| `reviewId` | FK to Review                |
| `userId`   | FK to User (unique per review) |
| `isHelpful`| Boolean (true/false)        |

### `ProductRating`
| Field           | Description                 |
|----------------|-----------------------------|
| `productId`     | Primary key (FK to Product) |
| `averageRating` | Average rating (float)      |
| `totalReviews`  | Total number of reviews     |
| `ratingXCount`  | Count of 1–5 star reviews   |

---

## 🚦 API Endpoints

### 📝 Create Review
`POST /reviews`  
Auth: ✅ Required  
Body: `CreateReviewDto`  
- Requires verified purchase
- Auto-moderated before saving

### 🔍 Get Reviews
`GET /reviews?productId=1&page=1&limit=10&rating=5&verifiedOnly=true`  
Returns paginated, filtered reviews

### 🧾 Get Rating Summary
`GET /reviews/product/:productId/rating`  
Returns average and breakdown

### 🧠 Analytics
`GET /reviews/analytics?productId=1`  
Auth: ✅ Admin only  
Returns:
- Total reviews
- Average rating
- Distribution
- Monthly trend
- Verified vs unverified %

### 👍 Vote Helpful/Not
`POST /reviews/:id/vote`  
Body: `{ isHelpful: true }`  
- Updates helpful vote counters

### 🛠 Moderate Review
`PATCH /reviews/:id/moderate`  
Admin only  
Sets status + notes

---

## 🧠 Business Logic

- A user can only review a product once
- Only verified purchasers can submit reviews
- Moderation may auto-flag or admin can override
- Votes are tracked per user and update helpful score
- Ratings are aggregated per product for faster lookup

---

## 🛡️ Guards and Validation

- `JwtAuthGuard` protects most routes
- `AdminGuard` used for moderation and analytics
- Validation on DTOs using `class-validator`

---

## 📊 Event Emitters

- `review.created` – Used for audit or notifications
- `review.moderated` – Used to log or alert moderation

---

## 🧪 Testing

> Unit test scaffold is available in `review.service.spec.ts`. Tests include:

- Duplicate review prevention
- Verified purchase validation
- Review creation flow
- Voting logic
- Moderation action
- Analytics generation

---

## 🛠 Future Improvements

- Add full-text search for reviews
- Integrate AI-based moderation (e.g., Perspective API)
- Enable image attachments to reviews
- Add merchant dashboard widgets

---

## 👤 Contributors

- Review system by mdauwal
- Maintained by: xaxxoo
