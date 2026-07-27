"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export interface BookableProduct {
  productId: number
  name: string
  procedureName: string
  amount: number
  currencyId: number
  durationMinutes: number
}

interface BookingProductSelectorProps {
  products: BookableProduct[]
}

const currencyCodeById: Record<number, string> = {
  1: "ARS",
  2: "USD",
  3: "EUR",
  4: "CLP",
  5: "UYU",
  6: "MXN",
  7: "COP",
  8: "PEN",
  9: "BRL",
  10: "GTQ",
}

export function BookingProductSelector({ products }: BookingProductSelectorProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const selectedProduct = products.find((product) => product.productId === selectedProductId)
  const formatAmount = (amount: number, currencyId: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currencyCodeById[currencyId] || "ARS",
    }).format(amount)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-semibold">Elegí el servicio</h2>
        <p className="text-sm text-muted-foreground">
          Seleccioná el motivo de tu consulta para ver los próximos horarios.
        </p>
      </div>
      <div className="space-y-2">
        {products.map((product) => (
          <button
            key={product.productId}
            type="button"
            onClick={() => setSelectedProductId(product.productId)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              selectedProductId === product.productId
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.procedureName}</p>
              </div>
              <p className="font-medium">{formatAmount(product.amount, product.currencyId)}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Duración estimada: {product.durationMinutes} min
            </p>
          </button>
        ))}
      </div>
      {selectedProduct && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{selectedProduct.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedProduct.durationMinutes} min · {formatAmount(selectedProduct.amount, selectedProduct.currencyId)}
              </p>
            </div>
            <Button type="button">Elegir horario</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
