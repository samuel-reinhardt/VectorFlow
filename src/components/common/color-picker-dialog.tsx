import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/overlay/dialog';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/forms/input';
import { Label } from '@/components/ui/forms/label';
import { Check } from 'lucide-react';

interface ColorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  color: string;
  onChange: (color: string) => void;
  palette: string[];
  title?: string;
}

export function ColorPickerDialog({ 
  open, 
  onOpenChange, 
  color,
  onChange,
  palette,
  title = "Select Color"
}: ColorPickerDialogProps) {
    const [customColor, setCustomColor] = React.useState(color || '#000000');

    React.useEffect(() => {
        if (open) {
            setCustomColor(color || '#000000');
        }
    }, [open, color]);

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomColor(e.target.value);
        onChange(e.target.value);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {palette.length > 0 && (
                        <div className="space-y-2">
                            <Label>Project Palette</Label>
                            <div className="flex flex-wrap gap-2">
                                {palette.map((p) => (
                                    <button
                                        key={p}
                                        className={`w-8 h-8 rounded-full border shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 relative flex items-center justify-center`}
                                        style={{ backgroundColor: p }}
                                        onClick={() => {
                                            onChange(p);
                                            onOpenChange(false);
                                        }}
                                        title={p}
                                    >
                                        {p.toLowerCase() === customColor.toLowerCase() && (
                                            <Check className={`w-4 h-4 ${getContrastYIQ(p) === 'black' ? 'text-black' : 'text-white'}`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Custom Color</Label>
                        <div className="flex gap-2">
                             <input 
                                type="color" 
                                className="w-10 h-10 rounded cursor-pointer border p-0 shrink-0"
                                value={customColor}
                                onChange={handleCustomColorChange}
                            />
                            <Input 
                                value={customColor} 
                                onChange={handleCustomColorChange}
                                placeholder="#000000"
                                className="flex-1 font-mono"
                            />
                            <Button 
                                onClick={() => onOpenChange(false)}
                                size="default"
                                className="shrink-0"
                            >
                                Select
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper to determine text color based on background luminance
function getContrastYIQ(hexcolor: string){
    hexcolor = hexcolor.replace("#", "");
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}
