import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";
import { EmailProvider } from "@/types/api";

interface AddProviderDialogProps {
  onProviderAdded: (provider: EmailProvider) => void;
}

export function AddProviderDialog({ onProviderAdded }: AddProviderDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "" as "brevo" | "mailerlite" | "",
    apiKey: "",
    dailyQuota: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Provider name is required";
    }

    if (!formData.type) {
      newErrors.type = "Provider type is required";
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = "API key is required";
    }

    if (!formData.dailyQuota || parseInt(formData.dailyQuota) <= 0) {
      newErrors.dailyQuota = "Daily quota must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const newProvider = await apiService.createProvider({
        name: formData.name.trim(),
        type: formData.type as "brevo" | "mailerlite",
        apiKey: formData.apiKey.trim(),
        dailyQuota: parseInt(formData.dailyQuota),
      });

      onProviderAdded(newProvider);
      setOpen(false);
      setFormData({ name: "", type: "", apiKey: "", dailyQuota: "" });
      setErrors({});
    } catch (error) {
      console.error("Failed to create provider:", error);
      setErrors({ 
        submit: error instanceof Error ? error.message : "Failed to create provider" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Email Provider</DialogTitle>
          <DialogDescription>
            Configure a new email service provider to send emails through.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Provider Name</Label>
            <Input
              id="name"
              placeholder="e.g., My SendGrid Account"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Provider Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                <SelectValue placeholder="Select provider type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brevo">Brevo (formerly Sendinblue)</SelectItem>
                <SelectItem value="mailerlite">MailerLite</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={formData.apiKey}
              onChange={(e) => handleInputChange("apiKey", e.target.value)}
              className={errors.apiKey ? "border-red-500" : ""}
            />
            {errors.apiKey && (
              <p className="text-sm text-red-500">{errors.apiKey}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyQuota">Daily Quota</Label>
            <Input
              id="dailyQuota"
              type="number"
              placeholder="e.g., 10000"
              value={formData.dailyQuota}
              onChange={(e) => handleInputChange("dailyQuota", e.target.value)}
              className={errors.dailyQuota ? "border-red-500" : ""}
              min="1"
            />
            {errors.dailyQuota && (
              <p className="text-sm text-red-500">{errors.dailyQuota}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Maximum number of emails this provider can send per day
            </p>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Provider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
