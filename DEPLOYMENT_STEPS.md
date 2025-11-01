# Deployment Steps for MockTest on Hostinger VPS

## Prerequisites
1. Hostinger VPS with IP: 195.35.6.57
2. Root access: ssh root@195.35.6.57
3. Domain: prepzon.com (registered with Bluehost)
4. Project files ready for deployment

## Deployment Process

### 1. Connect to Your VPS
```bash
ssh root@195.35.6.57
```

### 2. Upload Project Files
Upload your project files to the VPS. You can use SCP:
```bash
# From your local machine, run this command:
scp -r /path/to/your/local/MockTest/* root@195.35.6.57:/root/MockTest/
```

### 3. Run the Deployment Script
```bash
# Connect to your VPS
ssh root@195.35.6.57

# Make the deployment script executable
chmod +x /root/MockTest/deploy.sh

# Run the deployment script
/root/MockTest/deploy.sh
```

### 4. Configure DNS at Bluehost
1. Log in to your Bluehost account
2. Go to the DNS management section for prepzon.com
3. Add or update the A record to point to your VPS IP: 195.35.6.57
4. Add or update the www CNAME record to point to prepzon.com

### 5. SSL Certificate (Optional but Recommended)
After deployment, you can secure your site with HTTPS:
```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Obtain and install SSL certificate
certbot --nginx -d prepzon.com -d www.prepzon.com
```

### 6. Verify Deployment
1. Check if the service is running:
```bash
systemctl status mocktest.service
```

2. Check Nginx status:
```bash
systemctl status nginx
```

3. Visit your website: http://prepzon.com

## Managing Your Application

### To restart the backend service:
```bash
systemctl restart mocktest.service
```

### To check logs:
```bash
# Backend logs
journalctl -u mocktest.service -f

# Nginx logs
tail -f /var/log/nginx/mocktest.access.log
tail -f /var/log/nginx/mocktest.error.log
```

### To update the application:
1. Upload new files to the server
2. Rebuild the frontend:
```bash
cd /root/MockTest/Frontend
npm run build
cp -r dist/* /var/www/mocktest/
```
3. Restart services:
```bash
systemctl restart mocktest.service
systemctl restart nginx
```