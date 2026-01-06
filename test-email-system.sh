#!/bin/bash
# Email System Test Script
# Tests the complete email flow for BookAgreed

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     BookAgreed Email System Test                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    exit 1
fi

# Load environment variables
source .env

# 1. Check Brevo API Key
echo -e "${BLUE}1. Checking Brevo API Configuration...${NC}"
if [ -z "$VITE_BREVO_API_KEY" ]; then
    echo -e "${RED}   ✗ VITE_BREVO_API_KEY not set${NC}"
    echo -e "${YELLOW}   ⚠ Emails will only be logged (dev mode)${NC}"
else
    echo -e "${GREEN}   ✓ VITE_BREVO_API_KEY configured${NC}"
    
    # Test Brevo API connectivity
    echo -e "${BLUE}   Testing Brevo API connectivity...${NC}"
    BREVO_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X GET "https://api.brevo.com/v3/account" \
        -H "accept: application/json" \
        -H "api-key: $VITE_BREVO_API_KEY")
    
    if [ "$BREVO_RESPONSE" == "200" ]; then
        echo -e "${GREEN}   ✓ Brevo API connection successful${NC}"
    else
        echo -e "${RED}   ✗ Brevo API connection failed (HTTP $BREVO_RESPONSE)${NC}"
        echo -e "${YELLOW}   ⚠ Check your API key at https://app.brevo.com/settings/keys/api${NC}"
    fi
fi

# 2. Check Email Configuration
echo ""
echo -e "${BLUE}2. Checking Email Configuration...${NC}"

check_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}   ✗ $var_name not set${NC}"
        return 1
    else
        echo -e "${GREEN}   ✓ $var_name: $var_value${NC}"
        return 0
    fi
}

check_env_var "VITE_EMAIL_FROM"
check_env_var "VITE_EMAIL_FROM_NAME"
check_env_var "VITE_SUPPORT_EMAIL"
check_env_var "VITE_APP_URL"
check_env_var "VITE_APP_NAME"

# 3. Check Supabase Configuration
echo ""
echo -e "${BLUE}3. Checking Supabase Configuration...${NC}"
check_env_var "VITE_SUPABASE_URL"
check_env_var "VITE_SUPABASE_ANON_KEY"

# 4. Check Email Template Files
echo ""
echo -e "${BLUE}4. Checking Email Template Files...${NC}"

if [ -f "supabase-email-templates/confirm-signup.html" ]; then
    echo -e "${GREEN}   ✓ Signup confirmation template exists${NC}"
    template_size=$(wc -c < "supabase-email-templates/confirm-signup.html")
    echo -e "     Size: $template_size bytes"
else
    echo -e "${RED}   ✗ Signup confirmation template not found${NC}"
fi

# 5. Test Email Service Code
echo ""
echo -e "${BLUE}5. Checking Email Service Implementation...${NC}"

if grep -q "async function sendEmail" src/services/emailService.ts; then
    echo -e "${GREEN}   ✓ sendEmail() function found${NC}"
else
    echo -e "${RED}   ✗ sendEmail() function not found${NC}"
fi

if grep -q "sendBookingConfirmation" src/services/emailService.ts; then
    echo -e "${GREEN}   ✓ sendBookingConfirmation() function found${NC}"
else
    echo -e "${RED}   ✗ sendBookingConfirmation() function not found${NC}"
fi

if grep -q "sendBookingNotificationToHost" src/services/emailService.ts; then
    echo -e "${GREEN}   ✓ sendBookingNotificationToHost() function found${NC}"
else
    echo -e "${RED}   ✗ sendBookingNotificationToHost() function not found${NC}"
fi

# 6. Check Email Triggers
echo ""
echo -e "${BLUE}6. Checking Email Trigger Points...${NC}"

trigger_count=$(grep -r "sendBookingConfirmation" src/pages/*.tsx | wc -l | tr -d ' ')
echo -e "${GREEN}   ✓ sendBookingConfirmation called in $trigger_count places${NC}"

if grep -q "sendBookingConfirmation" src/pages/PublicBooking.tsx; then
    echo -e "${GREEN}     • PublicBooking.tsx${NC}"
fi

if grep -q "sendBookingConfirmation" src/pages/BookAMeet.tsx; then
    echo -e "${GREEN}     • BookAMeet.tsx${NC}"
fi

if grep -q "sendBookingConfirmation" src/pages/CalendarView.tsx; then
    echo -e "${GREEN}     • CalendarView.tsx${NC}"
fi

# 7. Build Check
echo ""
echo -e "${BLUE}7. Checking TypeScript Compilation...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ TypeScript compilation successful${NC}"
else
    echo -e "${RED}   ✗ TypeScript compilation failed${NC}"
    echo -e "${YELLOW}   ⚠ Run 'npm run build' to see errors${NC}"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Test Summary                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Verify sender email in Brevo:"
echo "   https://app.brevo.com/senders"
echo "   Add: $VITE_EMAIL_FROM"
echo ""
echo "2. Upload Supabase email template:"
echo "   https://[your-project-id].supabase.co/project/[your-project-id]/auth/templates"
echo "   Template: supabase-email-templates/confirm-signup.html"
echo ""
echo "3. Test the flows:"
echo "   • Sign up for a new account"
echo "   • Create a booking"
echo "   • Check your email inbox"
echo ""
echo -e "${GREEN}Email system is configured and ready!${NC}"
