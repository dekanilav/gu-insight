import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Upload, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNewspaper } from "@/hooks/use-newspaper";
import { useAdvertisements } from "@/hooks/use-advertisements";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import AdminLogin from "./admin-login";

export default function Admin() {
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({
    newspaper: null,
    'top-banner': null,
    'sidebar': null,
    'between-pages': null,
  });
  const [newspaperDate, setNewspaperDate] = useState(new Date().toISOString().split('T')[0]);
  const [newspaperTitle, setNewspaperTitle] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: newspapers = [] } = useNewspaper();
  const { data: advertisements = [] } = useAdvertisements();
  const { isAuthenticated, isLoading, logout, isLoggingOut } = useAdminAuth();

  const uploadNewspaperMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/newspapers', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/newspapers'] });
      toast({
        title: "Success",
        description: "Newspaper uploaded successfully!",
      });
      setSelectedFiles(prev => ({ ...prev, newspaper: null }));
      setNewspaperTitle('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload newspaper",
        variant: "destructive",
      });
    },
  });

  const uploadAdMutation = useMutation({
    mutationFn: async ({ formData }: { formData: FormData }) => {
      return apiRequest('POST', '/api/advertisements', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements'] });
      toast({
        title: "Success",
        description: "Advertisement uploaded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload advertisement",
        variant: "destructive",
      });
    },
  });

  const deleteNewspaperMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/newspapers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/newspapers'] });
      toast({
        title: "Success",
        description: "Newspaper deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete newspaper",
        variant: "destructive",
      });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/advertisements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements'] });
      toast({
        title: "Success",
        description: "Advertisement deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete advertisement",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-skeleton w-48 h-8 rounded mb-4"></div>
          <p className="text-secondary-newspaper">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLogin onLoginSuccess={() =>
        queryClient.invalidateQueries({ queryKey: ['/api/admin/check'] })
      } />
    );
  }

  const handleFileSelect = (key: string, file: File | null) => {
    setSelectedFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleUploadNewspaper = () => {
    if (!selectedFiles.newspaper || !newspaperDate) {
      toast({
        title: "Error",
        description: "Please select a file and date",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFiles.newspaper);
    formData.append('date', newspaperDate);
    formData.append('title', newspaperTitle || `Edition ${newspaperDate}`);

    uploadNewspaperMutation.mutate(formData);
  };

  const handleUploadAd = (position: string) => {
    const file = selectedFiles[position];
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('position', position);

    uploadAdMutation.mutate({ formData });
  };

  const getAdByPosition = (position: string) => {
    return advertisements.find(ad => ad.position === position);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl font-serif font-bold text-primary-newspaper">Admin Panel</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Newspaper Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">Newspaper Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newspaper-file" className="block text-sm font-medium mb-2">
                  Upload New Edition
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop PDF or Image files here, or click to browse
                  </p>
                  <Input
                    id="newspaper-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect('newspaper', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('newspaper-file')?.click()}
                  >
                    Select File
                  </Button>
                  {selectedFiles.newspaper && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {selectedFiles.newspaper.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="newspaper-title" className="block text-sm font-medium mb-2">
                  Edition Title (Optional)
                </Label>
                <Input
                  id="newspaper-title"
                  type="text"
                  placeholder="e.g., Sunday Special Edition"
                  value={newspaperTitle}
                  onChange={(e) => setNewspaperTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="newspaper-date" className="block text-sm font-medium mb-2">
                  Edition Date
                </Label>
                <Input
                  id="newspaper-date"
                  type="date"
                  value={newspaperDate}
                  onChange={(e) => setNewspaperDate(e.target.value)}
                />
              </div>

              <Button
                onClick={handleUploadNewspaper}
                disabled={uploadNewspaperMutation.isPending}
                className="w-full bg-accent-newspaper text-white hover:bg-blue-700"
              >
                {uploadNewspaperMutation.isPending ? "Uploading..." : "Upload Edition"}
              </Button>

              {/* Current Editions */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Current Editions</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newspapers.map((edition) => (
                    <div key={edition.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">
                          {new Date(edition.date).toLocaleDateString()} - {edition.title}
                        </span>
                        <div className="text-xs text-gray-500">{edition.filename}</div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteNewspaperMutation.mutate(edition.id)}
                        disabled={deleteNewspaperMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {newspapers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No editions uploaded yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advertisement Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">Advertisement Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Top Banner Ad */}
              <div>
                <Label className="block text-sm font-medium mb-2">Top Banner (300x250)</Label>
                <div className="border border-gray-300 rounded-lg p-4">
                  {getAdByPosition('top-banner') && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">
                        {getAdByPosition('top-banner')?.filename}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAdMutation.mutate(getAdByPosition('top-banner')!.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileSelect('top-banner', e.target.files?.[0] || null)}
                    className="mb-2"
                  />
                  <Button
                    onClick={() => handleUploadAd('top-banner')}
                    disabled={!selectedFiles['top-banner'] || uploadAdMutation.isPending}
                    size="sm"
                    className="w-full"
                  >
                    Upload Banner
                  </Button>
                </div>
              </div>

              {/* Sidebar Ad */}
              <div>
                <Label className="block text-sm font-medium mb-2">Sidebar (300x600)</Label>
                <div className="border border-gray-300 rounded-lg p-4">
                  {getAdByPosition('sidebar') && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">
                        {getAdByPosition('sidebar')?.filename}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAdMutation.mutate(getAdByPosition('sidebar')!.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileSelect('sidebar', e.target.files?.[0] || null)}
                    className="mb-2"
                  />
                  <Button
                    onClick={() => handleUploadAd('sidebar')}
                    disabled={!selectedFiles['sidebar'] || uploadAdMutation.isPending}
                    size="sm"
                    className="w-full"
                  >
                    Upload Sidebar Ad
                  </Button>
                </div>
              </div>

              {/* Between Pages Ad */}
              <div>
                <Label className="block text-sm font-medium mb-2">Between Pages (728x90)</Label>
                <div className="border border-gray-300 rounded-lg p-4">
                  {getAdByPosition('between-pages') && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">
                        {getAdByPosition('between-pages')?.filename}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAdMutation.mutate(getAdByPosition('between-pages')!.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileSelect('between-pages', e.target.files?.[0] || null)}
                    className="mb-2"
                  />
                  <Button
                    onClick={() => handleUploadAd('between-pages')}
                    disabled={!selectedFiles['between-pages'] || uploadAdMutation.isPending}
                    size="sm"
                    className="w-full"
                  >
                    Upload Between Pages Ad
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
