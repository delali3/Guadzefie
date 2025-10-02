-- src/sql/vendor_schema.sql
-- Multi-vendor Feature Database Schema

-- Vendor Applications Table
CREATE TABLE IF NOT EXISTS vendor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('farm', 'manufacturer', 'distributor', 'retailer')),
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    business_email VARCHAR(255) NOT NULL,
    business_phone VARCHAR(50) NOT NULL,
    business_address JSONB NOT NULL,
    business_description TEXT NOT NULL,
    years_in_business INTEGER NOT NULL DEFAULT 0,
    website_url TEXT,
    social_media_links JSONB,
    product_categories TEXT[] NOT NULL,
    estimated_monthly_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
    bank_account_info JSONB NOT NULL,
    documents JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
    commission_rate DECIMAL(5,4) DEFAULT 0.15,
    approval_notes TEXT,
    rejection_reason TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Profiles Table
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    application_id UUID REFERENCES vendor_applications(id),
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    total_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_commission DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_products INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    performance_score INTEGER NOT NULL DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
    joining_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    settings JSONB NOT NULL DEFAULT '{"auto_approve_products": false, "notification_preferences": {"new_orders": true, "low_stock": true, "commission_updates": true, "performance_reports": true}}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commissions Table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sale_amount DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'paid', 'disputed')),
    calculated_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payout_id UUID REFERENCES payouts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts Table
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_commission DECIMAL(15,2) NOT NULL,
    commission_count INTEGER NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'check')),
    payment_reference VARCHAR(100),
    payment_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Performance Metrics Table
CREATE TABLE IF NOT EXISTS vendor_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    sales_performance INTEGER NOT NULL DEFAULT 0 CHECK (sales_performance >= 0 AND sales_performance <= 100),
    customer_satisfaction INTEGER NOT NULL DEFAULT 0 CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 100),
    product_quality INTEGER NOT NULL DEFAULT 0 CHECK (product_quality >= 0 AND product_quality <= 100),
    shipping_performance INTEGER NOT NULL DEFAULT 0 CHECK (shipping_performance >= 0 AND shipping_performance <= 100),
    communication_score INTEGER NOT NULL DEFAULT 0 CHECK (communication_score >= 0 AND communication_score <= 100),
    compliance_score INTEGER NOT NULL DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Analytics Table
CREATE TABLE IF NOT EXISTS vendor_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_commission DECIMAL(15,2) NOT NULL DEFAULT 0,
    average_order_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    return_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    customer_satisfaction DECIMAL(3,2) NOT NULL DEFAULT 0,
    top_selling_products JSONB,
    sales_by_category JSONB,
    monthly_performance JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, period, period_start)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_business_type ON vendor_applications(business_type);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_status ON vendor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_performance_score ON vendor_profiles(performance_score);

CREATE INDEX IF NOT EXISTS idx_commissions_vendor_id ON commissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);

CREATE INDEX IF NOT EXISTS idx_payouts_vendor_id ON payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at);

CREATE INDEX IF NOT EXISTS idx_vendor_performance_metrics_vendor_id ON vendor_performance_metrics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_analytics_vendor_id ON vendor_analytics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_analytics_period ON vendor_analytics(period, period_start);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_applications_updated_at BEFORE UPDATE ON vendor_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_profiles_updated_at BEFORE UPDATE ON vendor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_analytics ENABLE ROW LEVEL SECURITY;

-- Vendor Applications Policies
CREATE POLICY "Users can view their own applications" ON vendor_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" ON vendor_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications" ON vendor_applications
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all applications" ON vendor_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (is_admin = true OR role = 'admin')
        )
    );

CREATE POLICY "Admins can update all applications" ON vendor_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (is_admin = true OR role = 'admin')
        )
    );

-- Vendor Profiles Policies
CREATE POLICY "Vendors can view their own profile" ON vendor_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own profile" ON vendor_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vendor profiles" ON vendor_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (is_admin = true OR role = 'admin')
        )
    );

-- Commissions Policies
CREATE POLICY "Vendors can view their own commissions" ON commissions
    FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all commissions" ON commissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (is_admin = true OR role = 'admin')
        )
    );

-- Payouts Policies
CREATE POLICY "Vendors can view their own payouts" ON payouts
    FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all payouts" ON payouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (is_admin = true OR role = 'admin')
        )
    );

-- Performance Metrics Policies
CREATE POLICY "Vendors can view their own metrics" ON vendor_performance_metrics
    FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all metrics" ON vendor_performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (is_admin = true OR role = 'admin')
        )
    );

-- Analytics Policies
CREATE POLICY "Vendors can view their own analytics" ON vendor_analytics
    FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all analytics" ON vendor_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (is_admin = true OR role = 'admin')
        )
    );

-- Functions for calculating commissions
CREATE OR REPLACE FUNCTION calculate_vendor_commission(
    p_vendor_id UUID,
    p_order_id INTEGER,
    p_product_id INTEGER,
    p_sale_amount DECIMAL
) RETURNS TABLE (
    commission_rate DECIMAL,
    commission_amount DECIMAL
) AS $$
DECLARE
    v_commission_rate DECIMAL := 0.15; -- Default rate
    v_vendor_profile RECORD;
    v_total_sales DECIMAL := 0;
BEGIN
    -- Get vendor profile
    SELECT * INTO v_vendor_profile
    FROM vendor_profiles
    WHERE user_id = p_vendor_id;

    IF v_vendor_profile IS NOT NULL THEN
        v_commission_rate := v_vendor_profile.commission_rate;

        -- Get total sales for tier calculation
        SELECT COALESCE(SUM(sale_amount), 0) INTO v_total_sales
        FROM commissions
        WHERE vendor_id = p_vendor_id AND status = 'paid';

        -- Apply tier bonuses (simplified logic)
        IF v_total_sales > 1000000 THEN
            v_commission_rate := v_commission_rate * 1.25; -- 25% bonus for top tier
        ELSIF v_total_sales > 500000 THEN
            v_commission_rate := v_commission_rate * 1.15; -- 15% bonus for gold tier
        ELSIF v_total_sales > 100000 THEN
            v_commission_rate := v_commission_rate * 1.10; -- 10% bonus for silver tier
        END IF;

        -- Cap at 30%
        v_commission_rate := LEAST(v_commission_rate, 0.30);
    END IF;

    RETURN QUERY SELECT
        v_commission_rate as commission_rate,
        (p_sale_amount * v_commission_rate) as commission_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to update vendor totals
CREATE OR REPLACE FUNCTION update_vendor_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update vendor profile totals when commission is paid
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        UPDATE vendor_profiles
        SET
            total_commission = total_commission + NEW.commission_amount,
            total_sales = total_sales + NEW.sale_amount,
            updated_at = NOW()
        WHERE user_id = NEW.vendor_id;
    END IF;

    -- Reverse if commission is unpaid
    IF OLD.status = 'paid' AND NEW.status != 'paid' THEN
        UPDATE vendor_profiles
        SET
            total_commission = total_commission - OLD.commission_amount,
            total_sales = total_sales - OLD.sale_amount,
            updated_at = NOW()
        WHERE user_id = OLD.vendor_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_totals_trigger
    AFTER UPDATE ON commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_totals();

-- Function to create vendor profile when application is approved
CREATE OR REPLACE FUNCTION create_vendor_profile_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Create vendor profile when application is approved
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO vendor_profiles (
            user_id,
            application_id,
            business_name,
            business_type,
            commission_rate
        ) VALUES (
            NEW.user_id,
            NEW.id,
            NEW.business_name,
            NEW.business_type,
            COALESCE(NEW.commission_rate, 0.15)
        ) ON CONFLICT (user_id) DO UPDATE SET
            application_id = EXCLUDED.application_id,
            business_name = EXCLUDED.business_name,
            business_type = EXCLUDED.business_type,
            commission_rate = EXCLUDED.commission_rate,
            status = 'active',
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_vendor_profile_on_approval_trigger
    AFTER UPDATE ON vendor_applications
    FOR EACH ROW
    EXECUTE FUNCTION create_vendor_profile_on_approval();