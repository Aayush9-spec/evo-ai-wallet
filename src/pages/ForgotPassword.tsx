
import { useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { KeyRound, ArrowLeft } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
});

const ForgotPassword = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, values.email);
            setIsEmailSent(true);
            toast({
                title: "Reset email sent",
                description: "Check your inbox for password reset instructions.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Could not send reset email.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-md mx-auto px-4 py-16">
            <Card className="border shadow-lg animate-fade-in">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive reset instructions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isEmailSent ? (
                        <div className="text-center space-y-4">
                            <div className="bg-green-50 text-green-800 p-4 rounded-md">
                                <p className="font-medium">Check your email</p>
                                <p className="text-sm mt-1">
                                    We have sent a password reset link to <strong>{form.getValues("email")}</strong>.
                                </p>
                            </div>
                            <Button asChild className="w-full bg-crypto-purple hover:bg-crypto-deep-purple">
                                <Link to="/login">Back to Login</Link>
                            </Button>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="you@example.com" type="email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full bg-crypto-purple hover:bg-crypto-deep-purple flex gap-2" disabled={isLoading}>
                                    <KeyRound size={18} /> {isLoading ? "Sending Link..." : "Send Reset Link"}
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <ArrowLeft size={14} /> Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ForgotPassword;
