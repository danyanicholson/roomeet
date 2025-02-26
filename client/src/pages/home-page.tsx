import { useQuery } from "@tanstack/react-query";
import ListingCard from "@/components/listing-card";
import SearchFilters from "@/components/search-filters";
import { Property } from "@shared/schema";
import { useState } from "react";

export default function HomePage() {
  const [filters, setFilters] = useState({});
  
  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const filteredProperties = properties.filter((property) => {
    if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.roomType && property.roomType !== filters.roomType) {
      return false;
    }
    if (filters.price && property.price > filters.price) {
      return false;
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        <div>
          <SearchFilters onFilterChange={setFilters} />
        </div>
        
        <div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              filteredProperties.map((property) => (
                <ListingCard key={property.id} property={property} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
