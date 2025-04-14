"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import DashboardLayout from "@/components/dashboard-layout"
import { supabase } from "@/lib/supabase"
import type { StoreSettings } from "@/lib/supabase"

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    id: "",
    store_name: "Pokhara Online Store",
    store_address: "",
    store_phone: "",
    store_email: "",
    logo_url: "",
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from("store_settings").select("*").limit(1).single()

        if (error) throw error

        if (data) {
          setStoreSettings(data)
        }
      } catch (error) {
        console.error("Error fetching store settings:", error)
      }
    }

    fetchSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setStoreSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)

    try {
      if (storeSettings.id) {
        // Update existing settings
        const { error } = await supabase
          .from("store_settings")
          .update({
            store_name: storeSettings.store_name,
            store_address: storeSettings.store_address,
            store_phone: storeSettings.store_phone,
            store_email: storeSettings.store_email,
            logo_url: storeSettings.logo_url,
          })
          .eq("id", storeSettings.id)

        if (error) throw error
      } else {
        // Insert new settings
        const { error } = await supabase.from("store_settings").insert([
          {
            store_name: storeSettings.store_name,
            store_address: storeSettings.store_address,
            store_phone: storeSettings.store_phone,
            store_email: storeSettings.store_email,
            logo_url: storeSettings.logo_url,
          },
        ])

        if (error) throw error
      }

      toast({
        title: "Settings saved",
        description: "Your store settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "There was an error saving your settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your store settings and preferences.</p>

        <Tabs defaultValue="store" className="space-y-4">
          <TabsList>
            <TabsTrigger value="store">Store Information</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Update your store details and contact information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="store_name">Store Name</Label>
                    <Input id="store_name" name="store_name" value={storeSettings.store_name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store_address">Address</Label>
                    <Input
                      id="store_address"
                      name="store_address"
                      value={storeSettings.store_address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store_phone">Phone</Label>
                    <Input
                      id="store_phone"
                      name="store_phone"
                      value={storeSettings.store_phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store_email">Email</Label>
                    <Input
                      id="store_email"
                      name="store_email"
                      type="email"
                      value={storeSettings.store_email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input id="logo_url" name="logo_url" value={storeSettings.logo_url} onChange={handleChange} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account settings and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input id="current_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input id="new_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input id="confirm_password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
