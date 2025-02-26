import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Property } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

interface ListingCardProps {
  property: Property;
}

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1626127587640-88cc66a25c67",
  "https://images.unsplash.com/photo-1625438961829-5a1c8f1dc742",
  "https://images.unsplash.com/photo-1625433031527-d50113db749e",
  "https://images.unsplash.com/photo-1720802704358-d5128e061516",
  "https://images.unsplash.com/photo-1676977529155-20dc61bc715d",
  "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a"
];

export default function ListingCard({ property }: ListingCardProps) {
  const imageUrl = property.imageUrls?.[0] || STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];

  return (
    <Card>
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img
          src={imageUrl}
          alt={property.title}
          className="object-cover w-full h-full"
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{property.title}</CardTitle>
          <p className="text-lg font-bold">${property.price}/mo</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{property.description}</p>
        <div className="flex gap-2 flex-wrap">
          {property.amenities?.map((amenity) => (
            <Badge key={amenity} variant="secondary">
              {amenity}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
