
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Save, User, Lock, Bell, Shield, Wallet, Cloud, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useWeb3 } from "@/contexts/Web3Context";
import { useNotifications } from "@/contexts/NotificationContext";
import { Badge } from "@/components/ui/badge";

const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, {
    message: "New password must be at least 8 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();
  const { user } = useAuth();
  const { isConnected, connectWallet, address, disconnectWallet } = useWeb3();
  const { permission, requestPermission } = useNotifications();

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.displayName?.toLowerCase().replace(/\s/g, '') || "",
      email: user?.email || "",
      name: user?.displayName || "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        username: user.displayName?.toLowerCase().replace(/\s/g, '') || "",
        email: user.email || "",
        name: user.displayName || "",
      });
    }
  }, [user, profileForm]);

  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus("idle");

    try {
      const { getChatbotResponse } = await import("@/services/aiService");
      const response = await getChatbotResponse("Hello, please respond with 'CONNECTION_ESTABLISHED' if you can hear me.");

      if (response.toLowerCase().includes("connection_established")) {
        setTestStatus("success");
        toast({
          title: "NEURAL_LINK_ESTABLISHED",
          description: "Groq Engine responded successfully.",
        });
      } else {
        setTestStatus("success"); // Still counts as success if we got a response
        toast({
          title: "NEURAL_LINK_ESTABLISHED",
          description: "Received AI response.",
        });
      }
    } catch (error) {
      setTestStatus("error");
      toast({
        title: "LINK_FAILURE",
        description: "Verify your API key and network connection.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const onProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated.",
    });
  };

  const onSecuritySubmit = (values: z.infer<typeof securityFormSchema>) => {
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully.",
    });
    securityForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="profile" className="flex gap-2 items-center">
            <User size={16} />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex gap-2 items-center">
            <Lock size={16} />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex gap-2 items-center">
            <Bell size={16} />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="wallets" className="flex gap-2 items-center">
            <Wallet size={16} />
            <span className="hidden sm:inline">Wallets</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex gap-2 items-center text-accent">
            <Shield size={16} className="animate-pulse" />
            <span className="hidden sm:inline">AI_Agent</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-crypto-purple hover:bg-crypto-deep-purple flex items-center gap-2">
                      <Save size={16} /> Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-crypto-purple hover:bg-crypto-deep-purple flex items-center gap-2">
                      <Save size={16} /> Update Password
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Enhance your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Enable 2FA</h4>
                <p className="text-sm text-muted-foreground">Protect your account with two-factor authentication</p>
              </div>
              <Switch />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Settings</CardTitle>
              <CardDescription>
                Configure how you receive neural market alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-2 p-4 rounded-lg border border-primary/10">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Zap size={16} className="text-accent" />
                    Neural Notifications
                  </h4>
                  <p className="text-sm text-muted-foreground">Receive critical market alerts even when the tab is closed</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className={permission === "granted" ? "text-accent border-accent" : "text-muted-foreground"}>
                    {permission.toUpperCase()}
                  </Badge>
                  <Switch
                    checked={permission === "granted"}
                    onCheckedChange={requestPermission}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Price Alerts</h4>
                  <p className="text-sm text-muted-foreground">Get notified about significant price changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Security Alerts</h4>
                  <p className="text-sm text-muted-foreground">Receive notifications about security events</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="button" className="bg-crypto-purple hover:bg-crypto-deep-purple flex items-center gap-2">
                  <Save size={16} /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Wallets</CardTitle>
              <CardDescription>
                Establish a Neural Link with your Web3 providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected ? (
                <div className="border border-accent/30 bg-accent/5 rounded-md p-4 flex justify-between items-center animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-accent/20 p-2">
                      <Zap className="h-6 w-6 text-accent animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium text-accent">Active_Neural_Link</p>
                      <p className="text-sm font-mono text-muted-foreground">{address}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={disconnectWallet} className="border-destructive text-destructive hover:bg-destructive/10">
                    Sever Link
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed border-muted-foreground/30 rounded-md p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="rounded-full bg-muted p-4">
                    <Wallet className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No Wallet Connected</p>
                    <p className="text-sm text-muted-foreground">Connect your wallet to enable autonomous trade execution.</p>
                  </div>
                  <Button onClick={connectWallet} className="bg-crypto-purple hover:bg-crypto-deep-purple">
                    Establish Neural Link
                  </Button>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">Supported Protocols</h4>
                <div className="flex gap-2">
                  <Badge variant="secondary">Ethereum</Badge>
                  <Badge variant="secondary">Polygon</Badge>
                  <Badge variant="secondary">Arbitrum</Badge>
                  <Badge variant="secondary">Base</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai" className="mt-6">
          <Card className="hud-panel border-accent/30 bg-accent/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-accent/20">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-accent neon-text uppercase tracking-widest">Neural_Core_Config</CardTitle>
                  <CardDescription className="text-xs font-mono">
                    CONFIGURE_AUTONOMOUS_TRADING_AGENT
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-black/40 border border-accent/20">
                  <h4 className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">Groq_Engine_Link</h4>
                  <p className="text-[10px] text-muted-foreground font-mono leading-relaxed mb-4">
                    THE_AGENT_REQUIRES_A_GROQ_API_KEY_TO_EXECUTE_HIGH_LEVEL_REASONING.
                    KEYS_ARE_STORED_LOCALLY_ON_YOUR_MACHINE.
                  </p>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">API_KEY_TOKEN</label>
                    <Input
                      type="password"
                      placeholder="gsk_********************"
                      className="bg-transparent border-accent/30 font-mono text-xs text-accent"
                      defaultValue={localStorage.getItem("GROQ_API_KEY") || ""}
                      onChange={(e) => {
                        localStorage.setItem("GROQ_API_KEY", e.target.value);
                        window.dispatchEvent(new Event('storage')); // Trigger update
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-primary/10">
                  <div>
                    <h4 className="text-xs font-bold uppercase flex items-center gap-2">
                      <Cloud size={14} className="text-blue-400" />
                      Persistent_Memory
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-mono">SYNC_PORTFOLIO_ACROSS_DEVICES_VIA_FIRESTORE</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-primary/10">
                  <div>
                    <h4 className="text-xs font-bold uppercase">Autonomous_Execution</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">ALLOW_AGENT_TO_PROPOSE_TRADES_IN_CHAT</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-primary/10">
                  <div>
                    <h4 className="text-xs font-bold uppercase">Real_Time_Analysis</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">STREAM_LIVE_MARKET_DATA_TO_NEURAL_LINK</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-4">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  variant="outline"
                  className={`font-mono text-[10px] tracking-widest px-8 ${testStatus === "success" ? "border-accent text-accent" :
                    testStatus === "error" ? "border-destructive text-destructive" :
                      "border-primary/30"
                    }`}
                >
                  {isTesting ? "SCANNING_LINK..." : testStatus === "success" ? "LINK_ACTIVE" : "TEST_CONNECTION"}
                </Button>
                <Button
                  onClick={() => toast({ title: "CORE_UPDATED", description: "NEURAL_LINK_ESTABLISHED" })}
                  className="bg-accent/20 hover:bg-accent/40 text-accent border border-accent/50 font-mono text-[10px] tracking-widest px-8"
                >
                  INITIALIZE_CORE
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
