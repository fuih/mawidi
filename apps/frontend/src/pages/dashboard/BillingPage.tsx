import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import api from "../../lib/api";

interface BillingStatus {
  subscription_status: string;
  subscription_end_date: string | null;
  price_dzd: number;
}

export function BillingPage() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      // 1. Silent fallback to verify any pending payments (in case webhook was missed, e.g. local testing)
      try {
        await api.post("/billing/verify");
      } catch (e) {
        console.error("Verification failed", e);
      }
      
      // 2. Fetch the actual status
      const res = await api.get("/billing/status");
      setStatus(res.data);
    } catch (err) {
      console.error(err);
      setError(t('billing.loadSubscriptionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError("");
    try {
      const res = await api.post("/billing/checkout");
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || t('billing.paymentCreationError'));
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">{t('billing.loading')}</div>;
  }

  if (!status) return null;

  const isPastDue = status.subscription_status === "past_due";
  const isTrial = status.subscription_status === "trial";
  const isActive = status.subscription_status === "active";

  const endDate = status.subscription_end_date 
    ? new Date(status.subscription_end_date).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'en' ? 'en-US' : 'fr-FR', {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : t('billing.undefined');

  return (
    <div className="max-w-4xl mx-auto text-start">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('billing.billingTitle')}</h1>
        <p className="text-gray-500">{t('billing.billingDesc')}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 text-start">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('billing.subscriptionStatus')}</h2>
          
          <div className="flex items-center gap-3 mb-6">
            {isPastDue && (
              <>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="font-semibold text-red-600">{t('billing.expired')}</div>
                  <div className="text-sm text-gray-500">{t('billing.profileHidden')}</div>
                </div>
              </>
            )}
            {isTrial && (
              <>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-blue-600">{t('billing.trialPeriod')}</div>
                  <div className="text-sm text-gray-500">{t('billing.validUntil', { date: endDate })}</div>
                </div>
              </>
            )}
            {isActive && (
              <>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-green-600">{t('billing.active')}</div>
                  <div className="text-sm text-gray-500">{t('billing.renewalOn', { date: endDate })}</div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm gap-2">
              <span className="text-gray-500">{t('billing.currentPlan')}</span>
              <span className="font-medium text-end">{t('billing.premiumMonthly')}</span>
            </div>
            <div className="flex justify-between items-center text-sm gap-2">
              <span className="text-gray-500">{t('billing.price')}</span>
              <span className="font-medium text-end">{t('billing.perMonth', { price: status.price_dzd })}</span>
            </div>
            <div className="flex justify-between items-center text-sm gap-2">
              <span className="text-gray-500">{t('billing.nextBillingDate')}</span>
              <span className="font-medium text-end">{endDate}</span>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col text-start">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('billing.payment')}</h2>
          <p className="text-sm text-gray-600 mb-6 flex-1">
            {t('billing.paymentDesc')}
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
            <div className="flex justify-between items-center mb-2 gap-2">
              <span className="text-sm text-gray-600">{t('billing.totalToPay')}</span>
              <span className="text-xl font-bold text-gray-900 text-end">{t('billing.totalAmount', { price: status.price_dzd })}</span>
            </div>
            <div className="text-xs text-gray-500">{t('billing.taxIncluded')}</div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {checkoutLoading ? (
              t('billing.redirectingToPayment')
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                {t('billing.payWithCib')}
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* TODO: Payment History table can go here later */}
    </div>
  );
}
