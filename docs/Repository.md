# Repository
In Java, a repository is a class or interface responsible for managing data access and storage.

It provides methods to retrieve, save, update, and delete objects from a data source such as a database or file system.
## DriverRepository

#### Attributes
- `store` - a `HashMap<String, Driver>` that holds all drivers keyed by their id
#### save(driver)
- Puts the driver into `store` using `driver.getId()` as the key
#### findById(id)
- Returns the `Driver` associated with the given id, or `null` if not found
#### findAll()
- Returns all drivers in the store as a new `ArrayList`
#### delete(id)
- Removes the driver with the given id from `store`
#### exists(id)
- Returns `true` if a driver with the given id is present in `store`

---
## RideRepository

#### Attributes
- `store` - a `HashMap<String, Ride>` that holds all rides keyed by their id
#### save(ride)
- Puts the ride into `store` using `ride.getId()` as the key
#### findById(id)
- Returns the `Ride` associated with the given id, or `null` if not found
#### findAll()
- Returns all rides in the store as a new `ArrayList`

---
## RideRequestRepository

#### Attributes
- `available` - an `ArrayList<RideRequest>` holding all pending ride requests
#### add(request)
- Appends the given `RideRequest` to `available`
#### remove(id)
- Removes the request whose id matches the given id using `removeIf`
#### getAll()
- Returns an unmodifiable view of `available` so callers can't mutate the list directly
#### findById(id)
- Streams through `available` and returns the first `RideRequest` matching the given id, wrapped in an `Optional`
#### isEmpty()
- Returns `true` if there are no pending ride requests in `available`
---
