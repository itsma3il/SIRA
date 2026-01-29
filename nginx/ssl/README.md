# SSL Certificate Setup Guide

This directory should contain your SSL/TLS certificates.

## Directory Structure

```
nginx/ssl/
├── fullchain.pem       # Full certificate chain
├── privkey.pem         # Private key
└── README.md           # This file
```

## Option 1: Let's Encrypt (Recommended)

### Using Certbot

1. Install Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. Obtain certificates:
```bash
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

3. Copy certificates to this directory:
```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
sudo chmod 644 ./nginx/ssl/fullchain.pem
sudo chmod 600 ./nginx/ssl/privkey.pem
```

4. Set up automatic renewal:
```bash
sudo certbot renew --dry-run
```

## Option 2: Self-Signed Certificates (Development/Testing)

Generate self-signed certificates:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/privkey.pem \
  -out ./nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

**Note:** Self-signed certificates will trigger browser warnings and should NOT be used in production.

## Option 3: Commercial Certificate

If you have a commercial certificate:

1. Place your certificate chain in `fullchain.pem`
2. Place your private key in `privkey.pem`
3. Ensure proper permissions:
```bash
chmod 644 fullchain.pem
chmod 600 privkey.pem
```

## Certificate Renewal

Let's Encrypt certificates expire every 90 days. Set up a cron job:

```bash
# Add to crontab (crontab -e)
0 0 * * * certbot renew --quiet && docker-compose -f docker-compose.prod.yml restart nginx
```

## Verification

Test your SSL configuration:

```bash
# Check certificate validity
openssl x509 -in fullchain.pem -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443

# Online SSL test
# Visit: https://www.ssllabs.com/ssltest/
```

## Security Checklist

- [ ] Certificates are from a trusted CA (or Let's Encrypt)
- [ ] Private key has restrictive permissions (600)
- [ ] Certificates are not expired
- [ ] Automatic renewal is configured
- [ ] HSTS is enabled in nginx.conf
- [ ] TLS 1.2+ only (no TLS 1.0/1.1)
- [ ] Strong cipher suites configured
- [ ] SSL/TLS testing shows A+ rating

## Troubleshooting

**nginx fails to start:**
- Check certificate paths in nginx.conf
- Verify file permissions
- Check certificate and key match:
  ```bash
  openssl x509 -noout -modulus -in fullchain.pem | openssl md5
  openssl rsa -noout -modulus -in privkey.pem | openssl md5
  # Should produce identical output
  ```

**Browser certificate warnings:**
- Verify DNS points to your server
- Check certificate is for correct domain
- Ensure certificate chain is complete
- Clear browser cache

## Contact

For certificate issues, contact your system administrator or refer to the SIRA deployment guide.
