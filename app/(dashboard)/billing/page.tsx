'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, DollarSign, Phone, AlertTriangle, ExternalLink, TrendingUp, Calendar, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BillingData {
  subscriptionStatus: string;
  canMakeCall: boolean;
  totalUnbilledCost: number;
  totalBilledCost: number;
  unbilledCallCount: number;
  unbilledTotalMinutes: number;
  unbilledSuccessfulCalls: number;
  unbilledFailedCalls: number;
  totalCallCount: number;
  thresholdAmount: number;
  percentageToThreshold: number;
  remainingUsage: number;
  hasExceededUsageLimit: boolean;
  hasUnpaidInvoices: boolean;
  needsPaymentRetry: boolean;
  recentCalls: Array<{
    id: string;
    call_name: string;
    cost: number | null;
    status: string;
    created_at: string;
  }>;
  currentPeriodEnd: string | null;
  subscriptionId: string | null;
  recentInvoices: Array<{
    id: string;
    amount: number;
    status: string;
    invoice_type: string;
    created_at: string;
    hosted_invoice_url: string | null;
  }>;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' || sessionId) {
      if (success === 'true') {
        toast.success('Subscription updated successfully!');
      }
      // Clean up URL parameters
      router.replace('/billing');
    }

    async function fetchData() {
      try {
        const response = await fetch('/api/billing/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch billing data');
        }
        const billingData = await response.json() as BillingData;
        setData(billingData);
      } catch (error) {
        console.error(error);
        toast.error('Could not load your billing information.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, searchParams]);

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const response = await fetch('/api/billing/manage', {
        method: 'POST',
      });
      const { url } = await response.json() as { url: string };
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Could not open the customer portal. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsManaging(false);
    }
  };

  const handleSubscribe = async () => {
    setIsManaging(true);
    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
      });
      const { url } = await response.json() as { url: string };
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Could not start the subscription process. Please try again.');
      }
    } catch (error) {
      console.log(error)
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsManaging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center">
        <p>Could not load billing data. Please try refreshing the page.</p>
      </div>
    );
  }

  const SubscriptionStatusBadge = ({ status }: { status: string }) => {
    const statusStyles: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      trialing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      past_due: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      canceled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      incomplete: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      incomplete_expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    const style = statusStyles[status] || statusStyles.default;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Billing & Usage
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your subscription and track your usage</p>
        </div>
        
        {/* Payment Alert */}
        {data.needsPaymentRetry && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">Action Required: Payment Failed</h3>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  Your last payment did not go through. Please update your payment method to restore full access.
                </p>
              </div>
              <Button 
                onClick={handleManageSubscription} 
                disabled={isManaging}
                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 font-semibold"
              >
                {isManaging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />} 
                Update Payment
              </Button>
            </div>
          </div>
        )}

        {/* Main Cards Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Your Plan Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 p-6 border-b border-primary/20 dark:border-primary/30">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/20 dark:bg-primary/30 p-2 rounded-lg">
                    <CreditCard className="h-6 w-6 text-primary dark:text-primary-light" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Plan</h3>
                    <p className="text-primary/80 dark:text-primary-light/80">Subscription details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trialing' ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Castform Voice Pro</span>
                        <SubscriptionStatusBadge status={data.subscriptionStatus} />
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">$149.00</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">per month</p>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-xl p-4 border border-primary/20 dark:border-primary/30">
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-primary dark:text-primary-light" />
                          <span className="font-medium text-primary dark:text-primary-light">
                            Next billing: {data.currentPeriodEnd ? new Date(data.currentPeriodEnd).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            }) : 'Not available'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleManageSubscription} 
                      disabled={isManaging} 
                      className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold py-3 rounded-xl transition-all duration-200"
                    >
                      {isManaging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />} 
                      Manage Subscription
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Get Started</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Subscribe to Castform Voice Pro to start making AI-powered calls</p>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$149.00</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">per month</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSubscribe} 
                      disabled={isManaging} 
                      className="w-full bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-semibold py-3 rounded-xl transition-all duration-200"
                    >
                      {isManaging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} 
                      Subscribe to Pro
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Usage Stats Card */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 dark:from-accent/20 dark:to-primary/20 p-6 border-b border-accent/20 dark:border-accent/30">
                <div className="flex items-center space-x-3">
                  <div className="bg-accent/20 dark:bg-accent/30 p-2 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-accent dark:text-accent-light" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Usage Analytics</h3>
                    <p className="text-accent/80 dark:text-accent-light/80">Current billing cycle</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Current Usage */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Unbilled Usage</h4>
                      <span className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                        ${(data.totalUnbilledCost / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Calls</span>
                        <span className="font-semibold">{data.unbilledCallCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Minutes</span>
                        <span className="font-semibold">{data.unbilledTotalMinutes}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                          <span className="text-gray-600 dark:text-gray-400">Successful</span>
                          <span className="font-semibold">{data.unbilledSuccessfulCalls}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full"></div>
                          <span className="text-gray-600 dark:text-gray-400">Failed</span>
                          <span className="font-semibold">{data.unbilledFailedCalls}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Billing Threshold */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Billing Threshold</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress to next bill</span>
                        <span className="font-semibold">{data.percentageToThreshold.toFixed(1)}%</span>
                      </div>
                      
                      <div className="relative">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(data.percentageToThreshold, 100)}%` }}
                          ></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-white drop-shadow">
                            ${(data.totalUnbilledCost / 100).toFixed(2)} / ${(data.thresholdAmount / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-xl p-3 border border-primary/20 dark:border-primary/30">
                        <p className="text-xs text-primary dark:text-primary-light">
                          <strong>${(data.remainingUsage / 100).toFixed(2)}</strong> remaining until automatic billing
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 p-6 border-b border-primary/20 dark:border-primary/30">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/20 dark:bg-primary/30 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-primary dark:text-primary-light" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Invoices</h3>
                <p className="text-primary/80 dark:text-primary-light/80">Your payment history</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {data.recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {data.recentInvoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-primary dark:text-primary-light" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {invoice.invoice_type === 'subscription_cycle' ? 'Monthly Subscription' : 'Usage Charge'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invoice.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        ${(invoice.amount / 100).toFixed(2)}
                      </span>
                      <SubscriptionStatusBadge status={invoice.status} />
                      {invoice.hosted_invoice_url && (
                        <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="rounded-lg">
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No invoices yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Your payment history will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
