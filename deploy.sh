#!/bin/bash

# MockTest Deployment Script for Hostinger VPS

echo "🚀 Starting MockTest deployment..."

# Update system packages
echo "🔄 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "🌐 Installing Nginx..."
    apt install -y nginx
fi

# Create project directory if it doesn't exist
echo "📁 Setting up project directory..."
mkdir -p /root/MockTest
mkdir -p /var/www/mocktest

# Copy files to server (you'll need to upload the files to your server first)
echo "📋 Copying project files..."
# You'll need to upload the project files to your server first
# scp -r ./* root@195.35.6.57:/root/MockTest/

# Navigate to backend directory
cd /root/MockTest/Backend

# Install backend dependencies
echo "⚙️ Installing backend dependencies..."
npm install --production

# Navigate to frontend directory
cd /root/MockTest/Frontend

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
npm install --production

# Build frontend for production
echo "🔨 Building frontend..."
npm run build

# Copy built files to web directory
echo "📂 Copying built files to web directory..."
cp -r dist/* /var/www/mocktest/

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/mocktest
chmod -R 755 /var/www/mocktest

# Copy nginx configuration
echo "🌐 Configuring Nginx..."
cp /root/MockTest/nginx.conf /etc/nginx/sites-available/prepzon.com
ln -s /etc/nginx/sites-available/prepzon.com /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "✅ Testing Nginx configuration..."
nginx -t

# Restart nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx

# Copy systemd service file
echo "サービ Copying systemd service file..."
cp /root/MockTest/mocktest.service /etc/systemd/system/mocktest.service

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# Enable and start the service
echo "🟢 Enabling and starting MockTest service..."
systemctl enable mocktest.service
systemctl start mocktest.service

# Check service status
echo "📊 Checking service status..."
systemctl status mocktest.service --no-pager

echo "🎉 Deployment completed!"
echo "📝 Next steps:"
echo "1. Update your domain DNS settings at Bluehost to point to 195.35.6.57"
echo "2. Access your application at http://prepzon.com"
echo "3. For SSL certificate, run: certbot --nginx -d prepzon.com -d www.prepzon.com"