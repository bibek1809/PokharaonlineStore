"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import DashboardLayout from "@/components/dashboard-layout"
import { supabase } from "@/lib/supabase"
import type { Customer, Product } from "@/lib/supabase"
import { X, Plus } from "lucide-react"

export default function NewSalePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedItems, setSelectedItems] = useState<
    {
      product_id: string
      quantity: number
      price: number
      total: number
    }[]
  >([])

  const [formData, setFormData] = useState({
    customer_id: "",
    total_amount: 0,
    discount: 0,
    payment_method: "",
    sale_date: new Date().toISOString().split("T")[0],
    nepali_month: "",
    nepali_year: "",
    notes: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: customersData, error: customersError } = await supabase.from("customers").select("*")

        const { data: productsData, error: productsError } = await supabase.from("products").select("*")

        if (customersError) throw customersError
        if (productsError) throw productsError

        setCustomers(customersData || [])
        setProducts(productsData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { product_id: "", quantity: 1, price: 0, total: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems]
    newItems.splice(index, 1)
    setSelectedItems(newItems)
    calculateTotal(newItems)
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems]

    if (field === "product_id") {
      const product = products.find((p) => p.id === value)
      if (product) {
        newItems[index] = {
          ...newItems[index],
          product_id: value,
          price: product.price,
          total: product.price * newItems[index].quantity,
        }
      }
    } else if (field === "quantity") {
      const quantity = Number.parseInt(value) || 0
      newItems[index] = {
        ...newItems[index],
        quantity,
        total: newItems[index].price * quantity,
      }
    }

    setSelectedItems(newItems)
    calculateTotal(newItems)
  }

  const calculateTotal = (items: typeof selectedItems) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const discount = Number.parseFloat(formData.discount.toString()) || 0
    const total = subtotal - discount

    setFormData((prev) => ({
      ...prev,
      total_amount: total,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            ...formData,
            total_amount: formData.total_amount,
            discount: Number.parseFloat(formData.discount.toString()) || 0,
          },
        ])
        .select()

      if (saleError) throw saleError

      if (saleData && saleData.length > 0) {
        const sale_id = saleData[0].id

        // Insert sale items
        const saleItems = selectedItems.map((item) => ({
          sale_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        }))

        const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

        if (itemsError) throw itemsError

        // Update product quantities
        for (const item of selectedItems) {
          const product = products.find((p) => p.id === item.product_id)
          if (product) {
            const newQuantity = product.quantity - item.quantity

            const { error: updateError } = await supabase
              .from("products")
              .update({ quantity: newQuantity })
              .eq("id", item.product_id)

            if (updateError) throw updateError
          }
        }
      }

      router.push("/sales")
      router.refresh()
    } catch (error) {
      console.error("Error adding sale:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">New Sale</h1>
        <p className="text-muted-foreground">Record a new sales transaction.</p>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sale Information</CardTitle>
                <CardDescription>Enter the details of the sale.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select onValueChange={(value) => handleSelectChange("customer_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale_date">Sale Date</Label>
                    <Input
                      id="sale_date"
                      name="sale_date"
                      type="date"
                      value={formData.sale_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select onValueChange={(value) => handleSelectChange("payment_method", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nepali_month">Nepali Month</Label>
                    <Select onValueChange={(value) => handleSelectChange("nepali_month", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baisakh">Baisakh</SelectItem>
                        <SelectItem value="Jestha">Jestha</SelectItem>
                        <SelectItem value="Ashadh">Ashadh</SelectItem>
                        <SelectItem value="Shrawan">Shrawan</SelectItem>
                        <SelectItem value="Bhadra">Bhadra</SelectItem>
                        <SelectItem value="Ashwin">Ashwin</SelectItem>
                        <SelectItem value="Kartik">Kartik</SelectItem>
                        <SelectItem value="Mangsir">Mangsir</SelectItem>
                        <SelectItem value="Poush">Poush</SelectItem>
                        <SelectItem value="Magh">Magh</SelectItem>
                        <SelectItem value="Falgun">Falgun</SelectItem>
                        <SelectItem value="Chaitra">Chaitra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nepali_year">Nepali Year</Label>
                    <Input
                      id="nepali_year"
                      name="nepali_year"
                      placeholder="2081"
                      value={formData.nepali_year}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional notes about the sale"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sale Items</CardTitle>
                <CardDescription>Add products to this sale.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>

                {selectedItems.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.product_id}
                              onValueChange={(value) => handleItemChange(index, "product_id", value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>Rs. {item.price.toFixed(2)}</TableCell>
                          <TableCell>Rs. {item.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="space-y-2 pt-4">
                  <div className="flex justify-between">
                    <Label>Subtotal:</Label>
                    <span>Rs. {selectedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="discount">Discount:</Label>
                    <Input
                      id="discount"
                      name="discount"
                      type="number"
                      className="w-32"
                      value={formData.discount}
                      onChange={(e) => {
                        handleChange(e)
                        calculateTotal(selectedItems)
                      }}
                    />
                  </div>
                  <div className="flex justify-between font-bold">
                    <Label>Total:</Label>
                    <span>Rs. {formData.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || selectedItems.length === 0}>
                  {isLoading ? "Processing..." : "Complete Sale"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
