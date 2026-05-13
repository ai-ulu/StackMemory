import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function SignupSuccessCard({ email, workflow }) {
  return (
    <Card className="w-full border-2 border-green-500/50">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle className="text-2xl">Verify your email</CardTitle>
        <CardDescription className="text-base">
          We sent a verification link to <strong>{email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          Check your inbox and use the link to activate your account.
        </p>
        <Alert>
          <AlertDescription>
            If the message is missing, check spam or wait a few minutes.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Link href={`/login?workflow=${workflow}`} className="w-full">
          <Button variant="outline" className="w-full">Back to login</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
