# ER diagram (matches the implemented Mongoose schemas)

```mermaid
erDiagram
  USER ||--o{ FARM : owns
  USER ||--o{ CROP : owns
  FARM ||--o{ CROP : contains
  FARM ||--o{ SOIL_RECORD : has
  FARM ||--o{ FARM_ACTIVITY : has
  CROP |o--o{ FARM_ACTIVITY : "optional link"
  USER ||--o{ ORDER : places
  ORDER ||--|{ ORDER_ITEM : "embeds"
  PRODUCT ||--o{ ORDER_ITEM : "referenced by"
  USER ||--o{ BOOKING : requests
  SERVICE ||--o{ BOOKING : "booked as"
  FARM |o--o{ BOOKING : "optional"
  USER ||--o{ POST : writes
  POST ||--o{ COMMENT : has
  USER ||--o{ COMMENT : writes
  USER |o--o{ ALERT : "receives (null = everyone)"

  USER { ObjectId _id string name string email UK string password_hash string role "farmer|admin" string language bool active }
  FARM { ObjectId owner FK string name string location number size string sizeUnit string soilType string irrigation }
  CROP { ObjectId owner FK ObjectId farm FK string name date sowingDate date expectedHarvestDate string stage string status }
  SOIL_RECORD { ObjectId owner FK ObjectId farm FK date observedAt number ph number moisture number NPK }
  FARM_ACTIVITY { ObjectId owner FK ObjectId farm FK ObjectId crop FK string type date date }
  PRODUCT { string name string category number price int stock bool active bool isDemo }
  ORDER { ObjectId user FK number total string status string paymentStatus "simulated" }
  ORDER_ITEM { ObjectId product FK string name_snapshot number price_snapshot int quantity }
  SERVICE { string name string category number price string_array slots int capacityPerSlot bool active }
  BOOKING { ObjectId user FK ObjectId service FK ObjectId farm FK date date string slot string status number price_snapshot }
  POST { ObjectId author FK string title string body string category }
  COMMENT { ObjectId post FK ObjectId author FK string body }
  ALERT { ObjectId user FK_nullable string type string severity string source "rule|admin" string key UK_with_user }
  WEATHER_CACHE { string key UK object payload date fetchedAt }
```

## How relationships are implemented in MongoDB
* **References (ObjectId + `ref`)** for 1-to-many links that grow or are queried alone: farm→owner, crop→farm, soil/activity→farm, booking→service/user, post→author, comment→post.
* **Embedding** where data is read together and never changes independently: `ORDER_ITEM` lines live inside `Order` with **snapshots** of product name/price, so history stays correct after price edits.
* **Redundant `owner` on Crop/Soil/Activity** (besides `farm`) makes ownership checks a single indexed query.
* **Cascades** are done in controllers: deleting a farm deletes its crops, activities and soil records; deleting a post deletes its comments; deleting a crop unlinks its activities.
* **Uniqueness/indexes**: `User.email` unique; `Farm(owner,name)` unique; `Alert(user,key)` unique (de-dup); `Booking(service,date,slot,status)`, `Soil(farm,observedAt)`, `Crop(owner,status)` for queries; `WeatherCache.key` unique.
* The static crop library (`cropInfo.json`) is not a collection (documented design choice).

## Differences from the supplied simplified diagram
The SkillWallet diagram's Crop `CropName (FK)` had no target and Booking linked to Product. Here: Crop belongs to Farm and User; **Order** (products) and **Booking** (services) are separate entities; Service, Product, Order items, soil records, activities, community and alerts were added. "Farmer" is the `USER` with `role = farmer` (no separate table).
