# Church Transportation Team Web Application

A comprehensive web application for managing church transportation services, connecting church members with reliable pickup services for church events.

## Features

### Core Functionality

- **Role-based Access Control**: Admin, Transportation Team Members, and Users
- **User Registration**: Email/password authentication with admin approval workflow
- **Service Management**: Configure regular and special church service days
- **Pickup Requests**: Users can request pickup services with time validation
- **Distance-based Matching**: Drivers see requests within their preferred distance
- **Real-time Status Tracking**: Track pickup request status from creation to completion

### User Roles

#### Regular Users

- Register for account (requires admin approval)
- Manage profile and pickup address
- Create pickup requests for church services
- View request history and status
- Receive notifications when requests are accepted

#### Transportation Team Members

- View and accept pickup requests within distance preferences
- Filter requests by distance (10km, 20km, 30km, 50km)
- Manage accepted pickups and mark as completed
- Dashboard showing assigned pickups and activity

#### Administrators

- User management (approve/reject registrations, assign roles)
- Service day configuration (add/edit/remove services)
- System analytics and monitoring
- Complete system oversight and management

### Technical Features

- **Modern Tech Stack**: NextJS 15, React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT tokens
- **Responsive Design**: Mobile-first approach with beautiful UI
- **Distance Calculation**: Geographic matching between drivers and users
- **WhatsApp Integration**: Ready for SMS notifications (setup required)

## Default Accounts

The application comes with pre-configured test accounts:

```
Admin Account:
Email: admin@church.com
Password: admin123

Transportation Team:
Email: driver@church.com
Password: driver123

Regular User:
Email: user@church.com
Password: user123
```

**Note**: These are test accounts for demonstration purposes. Change passwords after first login.

## Getting Started

### Prerequisites

- Node.js 19+ and npm/yarn
- PostgreSQL database
- (Optional) WhatsApp Cloud API account for notifications

### Installation

1. **Clone and Install Dependencies**

```bash
git clone git@github.com:Olawill/church-transport-application.git
cd church-transport-application
bun install
```

2. **Database Setup**
   The PostgreSQL database and environment variables are already configured. Generate Prisma client and run migrations:

```bash
bun run generate
bun runpush
```

3. **Seed Database**
   Populate the database with initial data:

```bash
bun prisma db seed
```

4. **Start Development Server**

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
app/
├── app/                     # Next.js App Router pages
│   ├── api/                # API routes
│   ├── dashboard/          # Dashboard pages
│   ├── admin/             # Admin-only pages
│   └── requests/          # Request management pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── admin/            # Admin components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
├── prisma/              # Database schema and migrations
├── docs/                # Documentation
└── scripts/             # Database seeding scripts
```

## API Endpoints

### Authentication

- `POST /api/signup` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication

### User Management

- `GET /api/users` - List users (with filters)
- `PUT /api/users` - Update user status/role

### Service Management

- `GET /api/service-days` - List active service days
- `POST /api/service-days` - Create new service day (admin)
- `PUT /api/service-days` - Update service day (admin)
- `DELETE /api/service-days` - Deactivate service day (admin)

### Pickup Requests

- `GET /api/pickup-requests` - List pickup requests
- `POST /api/pickup-requests` - Create pickup request
- `PUT /api/pickup-requests` - Update request status

### Dashboard

- `GET /api/dashboard/stats` - Admin dashboard statistics

## Database Schema

### Key Tables

- **users**: User accounts with roles and status
- **addresses**: User pickup addresses with coordinates
- **service_days**: Church service schedules
- **pickup_requests**: Pickup request records with status tracking
- **system_config**: Application configuration settings

### User Roles

- `ADMIN`: Full system access and management
- `TRANSPORTATION_TEAM`: Driver capabilities and request management
- `USER`: Regular church members requesting pickups

### Request Status Flow

1. `PENDING` - Newly created, awaiting driver acceptance
2. `ACCEPTED` - Driver has accepted the request
3. `COMPLETED` - Pickup completed successfully
4. `CANCELLED` - Request cancelled by user or admin

## WhatsApp Integration

The application includes a complete WhatsApp Cloud API integration framework:

### Setup Required

1. Facebook Developer Account
2. WhatsApp Business API access
3. Message templates approval
4. Environment variables configuration

### Features Ready

- Pickup acceptance notifications
- Reminder messages for upcoming services
- Driver notification for new requests
- Template-based messaging system

See `/docs/WHATSAPP_SETUP.md` for detailed setup instructions.

## Configuration

### Environment Variables

```env
DATABASE_URL=                    # PostgreSQL connection string
NEXTAUTH_URL=                   # Application URL
NEXTAUTH_SECRET=                # NextAuth.js secret key

# Optional: WhatsApp Integration
WHATSAPP_ACCESS_TOKEN=          # WhatsApp Cloud API token
WHATSAPP_PHONE_NUMBER_ID=       # Business phone number ID
WHATSAPP_WEBHOOK_VERIFY_TOKEN=  # Webhook verification token
```

### Default Service Schedule

- Sunday 11:00 AM - Morning Service
- Thursday 7:00 PM - Evening Service

Administrators can add, modify, or remove service days through the admin panel.

## Security Features

- **JWT Authentication**: Secure session management
- **Role-based Access Control**: Granular permission system
- **Input Validation**: Comprehensive form and API validation
- **SQL Injection Prevention**: Prisma ORM protection
- **Password Hashing**: bcrypt for secure password storage
- **CSRF Protection**: Built-in Next.js security features

## Mobile Responsiveness

The application is designed mobile-first with:

- Responsive navigation and layouts
- Touch-friendly interfaces
- Optimized forms for mobile input
- Accessible design patterns
- Progressive enhancement approach

## Development Guidelines

### Code Organization

- Server components for data fetching
- Client components for interactivity
- Reusable UI component library
- Type-safe with TypeScript
- Consistent styling with Tailwind CSS

### Testing Approach

- Component testing with Jest
- API route testing
- Database integration testing
- User flow testing

### Performance Optimization

- Server-side rendering where appropriate
- Image optimization with Next.js
- Database query optimization
- Caching strategies implementation

## Deployment

### Production Checklist

1. Update default account passwords
2. Configure production database
3. Set up proper environment variables
4. Configure domain and SSL certificates
5. Set up monitoring and logging
6. Configure backup strategies
7. Test WhatsApp integration (if used)

### Scaling Considerations

- Database connection pooling
- Image storage optimization
- CDN implementation for static assets
- Load balancing for high traffic
- Background job processing for notifications

## Support and Maintenance

### Regular Maintenance

- Database backups and maintenance
- Security updates and patches
- User account management
- Performance monitoring
- Analytics review

### Feature Enhancement

- Additional notification channels
- Advanced reporting and analytics
- Mobile application development
- Integration with church management systems
- Multi-church support (future enhancement)

## License

This project is designed for church communities and non-profit use. Please ensure compliance with your organization's software policies and requirements.

---

For additional support or questions about setup and configuration, please refer to the documentation in the `/docs` folder or contact your system administrator.
