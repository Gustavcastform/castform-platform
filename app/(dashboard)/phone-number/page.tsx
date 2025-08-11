'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

interface PhoneNumber {
  id: string;
  name: string;
  number: string;
}

export default function PhoneNumberPage() {
  const [phoneNumber, setPhoneNumber] = useState<PhoneNumber | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [twilioAccountSid, setTwilioAccountSid] = useState('');

  const [number, setNumber] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');

  useEffect(() => {
    // Fetch the connected phone number when the component mounts
    const fetchPhoneNumber = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/phone-numbers');
        if (res.ok) {
          const data = await res.json() as PhoneNumber;
          setPhoneNumber(data);
        } else {
          setPhoneNumber(null);
        }
      } catch (error) {
        console.error('Failed to fetch phone number:', error);
        setPhoneNumber(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPhoneNumber();
  }, []);

  const handleConnectNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/phone-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          twilioAccountSid,
          twilioAuthToken,
          number,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string; message?: any; details?: any };
        let errorMessage = 'Failed to connect phone number. Please check the details and try again.';

        if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (Array.isArray(errorData.message) && errorData.message.length > 1 && typeof errorData.message[1] === 'object') {
          errorMessage = errorData.message[1].message || errorMessage;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      const newPhoneNumber = await res.json() as PhoneNumber;
      setPhoneNumber(newPhoneNumber);
      toast.success('Phone number connected successfully!');
    } catch (error: any) {
        toast.error('Connection Failed', {
            description: error.message || 'An unexpected error occurred. Please try again.',
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnectNumber = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/phone-numbers', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to disconnect phone number');
      }

      setPhoneNumber(null);
      toast.success('Phone number disconnected successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4">
        {isLoading ? (
             <p>Loading...</p>
        ) : phoneNumber ? (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Connected Phone Number</CardTitle>
                    <CardDescription>This number will be used to make and receive calls.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                        <p className="font-semibold text-2xl">{phoneNumber.number}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{phoneNumber.name}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="destructive"
                        onClick={handleDisconnectNumber}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? 'Disconnecting...' : 'Disconnect Number'}
                    </Button>
                </CardFooter>
            </Card>
        ) : (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Connect your Phone Number</CardTitle>
                    <CardDescription>Provide your Twilio credentials to connect your existing phone number.</CardDescription>
                </CardHeader>
                <form onSubmit={handleConnectNumber}>
                    <CardContent className="space-y-4">
                        <div className="flex items-start p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/30">
                            <Info className="h-5 w-5 mr-3 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-300">
                                <p className="font-semibold text-white mb-2">Important Twilio Setup Requirements</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Your <strong>Account SID</strong> and <strong>Auth Token</strong> are on the main page of your <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Twilio Console</a>.</li>
                                    <li>Use a <strong>Phone Number</strong> that you have purchased from Twilio.</li>
                                    <li><strong>Paid Account Required:</strong> You must have a paid Twilio account to make calls to any phone number.</li>
                                    <li><strong>Enable Geo Permissions:</strong> Make sure you enable geo locations you want to call in your <a href="https://console.twilio.com/us1/develop/voice/settings/geo-permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Twilio Dashboard</a>.</li>
                                </ul>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Friendly Name</label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Sales Hotline"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="twilioAccountSid" className="block text-sm font-medium">Twilio Account SID</label>
                            <Input
                                id="twilioAccountSid"
                                type="text"
                                value={twilioAccountSid}
                                onChange={(e) => setTwilioAccountSid(e.target.value)}
                                placeholder="AC..."
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="twilioAuthToken" className="block text-sm font-medium">Twilio Auth Token</label>
                            <Input
                                id="twilioAuthToken"
                                type="password"
                                value={twilioAuthToken}
                                onChange={(e) => setTwilioAuthToken(e.target.value)}
                                placeholder="Your Twilio Auth Token"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="number" className="block text-sm font-medium">Phone Number</label>
                            <Input
                                id="number"
                                type="tel"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                placeholder="+15551234567"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? 'Connecting...' : 'Connect Number'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        )}
    </div>
  );
}
