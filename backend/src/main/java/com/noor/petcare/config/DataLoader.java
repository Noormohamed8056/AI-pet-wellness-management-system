package com.noor.petcare.config;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.noor.petcare.model.*;
import com.noor.petcare.repository.*;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner initDatabase(
            UserRepo userRepo,
            PetRepo petRepo,
            HealthMetricRepo healthMetricRepo,
            MedicalRecordRepo medicalRecordRepo,
            PrescriptionRepo prescriptionRepo,
            VetProfileRepo vetProfileRepo,
            UserProfileRepository userProfileRepo,
            ProductRepo productRepo,
            AppointmentRepo appointmentRepo,
            VetSlotRepo vetSlotRepo,
            OrderRepo orderRepo,
            OrderItemRepo orderItemRepo,
            FeedbackRepo feedbackRepo,
            BCryptPasswordEncoder passwordEncoder) {

        return args -> {
            // Check if data already exists
            if (userRepo.count() > 0) {
                System.out.println("Database already has data. Skipping initialization.");

                if (healthMetricRepo.count() == 0) {
                    List<Pet> existingPets = petRepo.findAll();
                    seedHealthMetrics(existingPets, healthMetricRepo);
                    System.out.println("✅ Seeded sample health metrics for existing pets.");
                }

                List<Pet> existingPets = petRepo.findAll();
                List<User> existingVets = userRepo.findByRole(User.Role.VET);
                if (!existingPets.isEmpty() && !existingVets.isEmpty()) {
                    seedHistoricalAppointmentsAndPrescriptions(
                            existingPets,
                            existingVets,
                            appointmentRepo,
                            vetSlotRepo,
                            medicalRecordRepo,
                            prescriptionRepo);
                }

                if (productRepo.count() == 0) {
                    List<Product> products = seedProducts(productRepo);
                    System.out.println("✅ Seeded 20 sample products.");
                }

                fixBrokenProductImageUrls(productRepo);

                if (orderRepo.count() == 0 && productRepo.count() > 0) {
                    List<User> owners = userRepo.findByRole(User.Role.OWNER);
                    List<Product> products = productRepo.findAll();
                    seedOrdersAndFeedback(owners, products, appointmentRepo, orderRepo, orderItemRepo, feedbackRepo, existingVets);
                    System.out.println("✅ Seeded 8 demo orders and customer feedback.");
                }

                return;
            }

            System.out.println("Initializing database with demo data...");

            // Create 5 Owner Users with Indian names
            List<User> owners = new ArrayList<>();
            String[][] ownerData = {
                {"Rajesh Kumar", "test1@gmail.com", "9876543210"},
                {"Priya Sharma", "test2@gmail.com", "9876543211"},
                {"Amit Patel", "test3@gmail.com", "9876543212"},
                {"Sneha Reddy", "test4@gmail.com", "9876543213"},
                {"Vikram Singh", "test5@gmail.com", "9876543214"}
            };

            for (String[] data : ownerData) {
                User owner = new User();
                owner.setName(data[0]);
                owner.setEmail(data[1]);
                owner.setPassword(passwordEncoder.encode("password123"));
                owner.setPhone(data[2]);
                owner.setRole(User.Role.OWNER);
                owner.setApproved(true);
                owner.setEmailVerified(true);
                owner.setCreatedAt(LocalDateTime.now());
                owner.setUpdatedAt(LocalDateTime.now());
                owners.add(userRepo.save(owner));

                // Create UserProfile for each owner
                UserProfile profile = new UserProfile();
                profile.setUser(owner);
                profile.setFullName(data[0]);
                profile.setAddress("123 Main Street");
                profile.setCity("Mumbai");
                profile.setState("Maharashtra");
                profile.setPincode("400001");
                profile.setBio("Pet lover and owner");
                userProfileRepo.save(profile);
            }

            // Create 3 Vet Doctors
            List<User> vets = new ArrayList<>();
            String[][] vetData = {
                {"Dr. Arjun Mehta", "vet1@petcare.com", "9876543220", "MBBS, MVSc", "General Veterinary", "Pet Care Hospital", "10"},
                {"Dr. Kavya Desai", "vet2@petcare.com", "9876543221", "BVSc, MVSc", "Surgery Specialist", "Care Plus Clinic", "8"},
                {"Dr. Rohan Iyer", "vet3@petcare.com", "9876543222", "BVSc, PhD", "Dermatology", "Animal Wellness Center", "12"}
            };

            for (String[] data : vetData) {
                User vet = new User();
                vet.setName(data[0]);
                vet.setEmail(data[1]);
                vet.setPassword(passwordEncoder.encode("vet123"));
                vet.setPhone(data[2]);
                vet.setRole(User.Role.VET);
                vet.setApproved(true);
                vet.setEmailVerified(true);
                vet.setCreatedAt(LocalDateTime.now());
                vet.setUpdatedAt(LocalDateTime.now());
                vets.add(userRepo.save(vet));

                // Create VetProfile
                VetProfile vetProfile = new VetProfile();
                vetProfile.setUser(vet);
                vetProfile.setQualification(data[3]);
                vetProfile.setSpecialization(data[4]);
                vetProfile.setHospitalName(data[5]);
                vetProfile.setExperienceYears(Integer.parseInt(data[6]));
                vetProfile.setLicenseNumber("VET" + (10000 + vets.size()));
                vetProfile.setBio("Experienced veterinarian dedicated to animal care");
                vetProfile.setConsultationFee(500);
                vetProfileRepo.save(vetProfile);

                // Create available slots for vets
                createVetSlots(vet, vetSlotRepo);
            }

            // Create 1 Admin User
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@petcare.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setPhone("9999999999");
            admin.setRole(User.Role.ADMIN);
            admin.setApproved(true);
            admin.setEmailVerified(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            userRepo.save(admin);

            // Create 3 pets for each owner
            String[][] petNames = {
                {"Bruno", "Max", "Bella"},
                {"Charlie", "Lucy", "Cooper"},
                {"Rocky", "Daisy", "Milo"},
                {"Simba", "Luna", "Tiger"},
                {"Shadow", "Coco", "Buddy"}
            };

            String[] species = {"Dog", "Cat", "Dog"};
            String[] breeds = {"Labrador", "Persian Cat", "Golden Retriever"};
            String[] genders = {"Male", "Female", "Male"};
            Integer[] ages = {3, 2, 4};
            String[] imageUrls = {
                "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80", // Labrador
                "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80", // Cat
                "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&q=80"  // Golden Retriever
            };

            List<Pet> createdPets = new ArrayList<>();
            for (int i = 0; i < owners.size(); i++) {
                for (int j = 0; j < 3; j++) {
                    Pet pet = new Pet();
                    pet.setName(petNames[i][j]);
                    pet.setSpecies(species[j]);
                    pet.setBreed(breeds[j]);
                    pet.setAge(ages[j]);
                    pet.setGender(genders[j]);
                    pet.setImageUrl(imageUrls[j]);
                    pet.setOwner(owners.get(i));
                    createdPets.add(petRepo.save(pet));
                }
            }

            seedHealthMetrics(createdPets, healthMetricRepo);
                seedHistoricalAppointmentsAndPrescriptions(
                    createdPets,
                    vets,
                    appointmentRepo,
                    vetSlotRepo,
                    medicalRecordRepo,
                    prescriptionRepo);

            List<Product> products = seedProducts(productRepo);
            seedOrdersAndFeedback(owners, products, appointmentRepo, orderRepo, orderItemRepo, feedbackRepo, vets);

            System.out.println("✅ Database initialized successfully!");
            System.out.println("📊 Created:");
            System.out.println("  - 5 Owner users (test1-5@gmail.com, password: password123)");
            System.out.println("  - 3 Vet doctors (vet1-3@petcare.com, password: vet123)");
            System.out.println("  - 1 Admin (admin@petcare.com, password: admin123)");
            System.out.println("  - 15 Pets (3 per owner)");
            System.out.println("  - Sample health metrics for pets");
            System.out.println("  - 5 recent appointments per pet");
            System.out.println("  - Prescriptions for completed visits");
            System.out.println("  - 20 Sample products with demo orders");
            System.out.println("  - 8 demo orders (various statuses)");
            System.out.println("  - Feedback reviews for completed appointments");
            System.out.println("  - Vet slots for appointments");
        };
    }

    private void seedHealthMetrics(List<Pet> pets, HealthMetricRepo healthMetricRepo) {
        if (pets == null || pets.isEmpty()) {
            return;
        }

        for (Pet pet : pets) {
            for (int dayOffset = 4; dayOffset >= 0; dayOffset--) {
                HealthMetric metric = new HealthMetric();
                metric.setPet(pet);
                metric.setDate(LocalDate.now().minusDays(dayOffset));
                metric.setWeight(8.0 + (pet.getId() % 10) + (dayOffset * 0.1));
                metric.setStressLevel(3 + (int) ((pet.getId() + dayOffset) % 4));
                metric.setActivityLevel(6 + (int) ((pet.getId() + dayOffset) % 3));
                metric.setAppetiteLevel(6 + (int) ((pet.getId() + dayOffset + 1) % 3));
                metric.setSleepHours(7.0 + ((pet.getId() + dayOffset) % 3));
                metric.setNotes("Daily wellness tracking entry");
                metric.setRecordedBy(HealthMetric.RecordedBy.OWNER);
                healthMetricRepo.save(metric);
            }
        }
    }

    private void seedHistoricalAppointmentsAndPrescriptions(
            List<Pet> pets,
            List<User> vets,
            AppointmentRepo appointmentRepo,
            VetSlotRepo vetSlotRepo,
            MedicalRecordRepo medicalRecordRepo,
            PrescriptionRepo prescriptionRepo) {

        if (pets == null || pets.isEmpty() || vets == null || vets.isEmpty()) {
            return;
        }

        Appointment.Status[] statusPattern = {
                Appointment.Status.COMPLETED,
                Appointment.Status.COMPLETED,
                Appointment.Status.APPROVED,
                Appointment.Status.PAID,
                Appointment.Status.BOOKED
        };

        for (Pet pet : pets) {
            long existingCount = appointmentRepo.countByPetId(pet.getId());
            int targetCount = 5;

            for (int index = (int) existingCount; index < targetCount; index++) {
                User vet = vets.get(index % vets.size());
                int dayOffset = getRecentDayOffset(index);

                LocalDate slotDate = LocalDate.now().minusDays(dayOffset);
                LocalTime start = LocalTime.of(9 + index, 0);

                VetSlot slot = new VetSlot();
                slot.setVet(vet);
                slot.setSlotDate(slotDate);
                slot.setStartTime(start);
                slot.setEndTime(start.plusHours(1));
                slot.setAvailable(false);
                VetSlot savedSlot = vetSlotRepo.save(slot);

                Appointment appointment = new Appointment();
                appointment.setUser(pet.getOwner());
                appointment.setPet(pet);
                appointment.setVet(vet);
                appointment.setSlot(savedSlot);
                appointment.setStatus(statusPattern[index % statusPattern.length]);
                appointment.setCreatedAt(slotDate.atTime(8, 30));
                Appointment savedAppointment = appointmentRepo.save(appointment);

                if (savedAppointment.getStatus() == Appointment.Status.COMPLETED) {
                    MedicalRecord medicalRecord = new MedicalRecord();
                    medicalRecord.setAppointment(savedAppointment);
                    medicalRecord.setVet(vet);
                    medicalRecord.setPet(pet);
                    medicalRecord.setDiagnosis("Routine health check - stable condition");
                    medicalRecord.setNotes("Vitals normal. Continue regular diet and exercise.");
                    MedicalRecord savedRecord = medicalRecordRepo.save(medicalRecord);

                    Prescription p1 = new Prescription();
                    p1.setMedicalRecord(savedRecord);
                    p1.setMedicineName("Pet Multivitamin");
                    p1.setDosage("1 tablet once daily");
                    p1.setDuration("14 days");
                    p1.setInstructions("Give after food");
                    prescriptionRepo.save(p1);

                    Prescription p2 = new Prescription();
                    p2.setMedicalRecord(savedRecord);
                    p2.setMedicineName("Omega-3 Supplement");
                    p2.setDosage("5 ml once daily");
                    p2.setDuration("10 days");
                    p2.setInstructions("Mix with morning meal");
                    prescriptionRepo.save(p2);
                }
            }
        }
    }

    private int getRecentDayOffset(int index) {
        int[] offsets = {7, 6, 4, 2, 0};
        if (index < 0) {
            return offsets[0];
        }
        if (index >= offsets.length) {
            return offsets[offsets.length - 1];
        }
        return offsets[index];
    }

    private void createVetSlots(User vet, VetSlotRepo vetSlotRepo) {
        // Create slots for next 7 days
        LocalDate today = LocalDate.now();
        for (int day = 0; day < 7; day++) {
            LocalDate slotDate = today.plusDays(day);
            // Morning slots: 9 AM to 12 PM
            for (int hour = 9; hour < 12; hour++) {
                VetSlot slot = new VetSlot();
                slot.setVet(vet);
                slot.setSlotDate(slotDate);
                slot.setStartTime(LocalTime.of(hour, 0));
                slot.setEndTime(LocalTime.of(hour + 1, 0));
                slot.setAvailable(true);
                vetSlotRepo.save(slot);
            }
            // Evening slots: 2 PM to 6 PM
            for (int hour = 14; hour < 18; hour++) {
                VetSlot slot = new VetSlot();
                slot.setVet(vet);
                slot.setSlotDate(slotDate);
                slot.setStartTime(LocalTime.of(hour, 0));
                slot.setEndTime(LocalTime.of(hour + 1, 0));
                slot.setAvailable(true);
                vetSlotRepo.save(slot);
            }
        }
    }

    private List<Product> seedProducts(ProductRepo productRepo) {
        List<Product> products = new ArrayList<>();
        String[][] productData = {
            {"Premium Dog Food - 10kg", "High-quality nutrition with chicken & rice", "1200.00", "50", "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500&q=80"},
            {"Cat Litter - 5kg", "Odor control premium cat litter", "350.00", "100", "https://images.unsplash.com/photo-1540573133985-87b6da97af72?w=500&q=80"},
            {"Pet Shampoo - 200ml", "Gentle hypoallergenic pet shampoo", "250.00", "80", "https://images.unsplash.com/photo-1582308069639-e4dba17db724?w=500&q=80"},
            {"Dog Collar & Leash Set", "Durable nylon with reflective straps", "450.00", "60", "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=500&q=80"},
            {"Interactive Cat Toy", "Feather wand toys for cats", "300.00", "70", "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&q=80"},
            {"Pet Multivitamin Tabs", "Daily supplement with vitamins", "550.00", "40", "https://images.unsplash.com/photo-1587854692152-cbe660dbde0b?w=500&q=80"},
            {"Dog Training Treats - 500g", "Healthy protein treats for training", "180.00", "120", "https://images.unsplash.com/photo-1568152950566-c1bf43ff4b4d?w=500&q=80"},
            {"Pet Bed - Large", "Comfortable memory foam pet bed", "1500.00", "30", "https://images.unsplash.com/photo-1599846975862-f3b5d271840c?w=500&q=80"},
            {"Grooming Brush Set", "Professional pet grooming tools", "280.00", "45", "https://images.unsplash.com/photo-1583511655857-d19db992cb74?w=500&q=80"},
            {"Pet First Aid Kit", "Complete emergency medical kit", "450.00", "25", "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80"},
            {"Dog Harness - M", "Adjustable ergonomic harness", "320.00", "55", "https://images.unsplash.com/photo-1601758228578-f64c06b9e38f?w=500&q=80"},
            {"Cat Scratching Post - 1m", "Sisal rope scratching post", "600.00", "35", "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=500&q=80"},
            {"Omega-3 Fish Oil - 250ml", "Joint support supplement", "480.00", "50", "https://images.unsplash.com/photo-1566087529147-08f3edd637d7?w=500&q=80"},
            {"Pet Water Fountain", "Automatic water bowl with filter", "890.00", "20", "https://images.unsplash.com/photo-1585664914660-b8b7b4e8b8b4?w=500&q=80"},
            {"Premium Dog Treats", "Grain-free chicken treats", "220.00", "100", "https://images.unsplash.com/photo-1585336261022-80ef832d3bbc?w=500&q=80"},
            {"Pet Nail Clipper", "Ergonomic stainless steel clipper", "150.00", "70", "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&q=80"},
            {"Flea & Tick Collar", "Natural insect repellent collar", "380.00", "60", "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&q=80"},
            {"Pet Travel Carrier", "Portable airline approved carrier", "1200.00", "15", "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=500&q=80"},
            {"Dog Rain Jacket", "Waterproof protective coat", "420.00", "40", "https://images.unsplash.com/photo-1544885278-ca5e3f4abd8c?w=500&q=80"},
            {"Cat Dental Treats", "Teeth cleaning chew sticks", "190.00", "85", "https://images.unsplash.com/photo-1585336261022-80ef832d3bbc?w=500&q=80"}
        };

        for (String[] data : productData) {
            Product p = new Product();
            p.setName(data[0]);
            p.setDescription(data[1]);
            p.setPrice(Double.parseDouble(data[2]));
            p.setStock(Integer.parseInt(data[3]));
            // Use the explicit image URL provided in the seed data when available
            String providedImage = data.length > 4 ? data[4] : null;
            if (providedImage != null && !providedImage.isBlank()) {
                p.setImageUrl(providedImage);
            } else {
                p.setImageUrl(resolveProductImageUrl(data[0]));
            }
            p.setActive(true);
            products.add(productRepo.save(p));
        }

        return products;
    }

    private void fixBrokenProductImageUrls(ProductRepo productRepo) {
        List<Product> products = productRepo.findAll();
        List<Product> updatedProducts = new ArrayList<>();

        for (Product product : products) {
            String imageUrl = product.getImageUrl();
            boolean shouldReplace = imageUrl == null || imageUrl.isBlank() || imageUrl.startsWith("/uploads/");

            if (shouldReplace) {
                product.setImageUrl(resolveProductImageUrl(product.getName()));
                updatedProducts.add(product);
            }
        }

        if (!updatedProducts.isEmpty()) {
            productRepo.saveAll(updatedProducts);
            System.out.println("✅ Repaired " + updatedProducts.size() + " product image URLs.");
        }
    }

    private String resolveProductImageUrl(String productName) {
        if (productName == null) {
            return "https://source.unsplash.com/600x600/?pet-products";
        }

        String normalized = productName.toLowerCase();

        if (normalized.contains("dog food")) {
            return "https://source.unsplash.com/600x600/?dog-food";
        }
        if (normalized.contains("cat litter")) {
            return "https://source.unsplash.com/600x600/?cat-litter";
        }
        if (normalized.contains("pet shampoo")) {
            return "https://source.unsplash.com/600x600/?pet-shampoo";
        }
        if (normalized.contains("dog collar") || normalized.contains("leash")) {
            return "https://source.unsplash.com/600x600/?dog-collar,leash";
        }
        if (normalized.contains("cat toy") || normalized.contains("interactive")) {
            return "https://source.unsplash.com/600x600/?cat-toy";
        }
        if (normalized.contains("multivitamin") || normalized.contains("vitamin") || normalized.contains("fish oil")) {
            return "https://source.unsplash.com/600x600/?pet-vitamin";
        }
        if (normalized.contains("treat")) {
            return "https://source.unsplash.com/600x600/?dog-treats";
        }
        if (normalized.contains("bed")) {
            return "https://source.unsplash.com/600x600/?pet-bed";
        }
        if (normalized.contains("grooming") || normalized.contains("brush")) {
            return "https://source.unsplash.com/600x600/?grooming-brush";
        }
        if (normalized.contains("first aid")) {
            return "https://source.unsplash.com/600x600/?pet-first-aid";
        }
        if (normalized.contains("harness")) {
            return "https://source.unsplash.com/600x600/?dog-harness";
        }
        if (normalized.contains("scratching post")) {
            return "https://source.unsplash.com/600x600/?cat-scratching-post";
        }
        if (normalized.contains("water fountain")) {
            return "https://source.unsplash.com/600x600/?pet-water-fountain";
        }
        if (normalized.contains("nail clipper")) {
            return "https://source.unsplash.com/600x600/?pet-nail-clipper";
        }
        if (normalized.contains("flea") || normalized.contains("tick")) {
            return "https://source.unsplash.com/600x600/?flea-collar";
        }
        if (normalized.contains("travel carrier")) {
            return "https://source.unsplash.com/600x600/?pet-travel-carrier";
        }
        if (normalized.contains("rain jacket")) {
            return "https://source.unsplash.com/600x600/?dog-rain-jacket";
        }

        return "https://source.unsplash.com/600x600/?pet-products";
    }

    private void seedOrdersAndFeedback(
            List<User> owners,
            List<Product> products,
            AppointmentRepo appointmentRepo,
            OrderRepo orderRepo,
            OrderItemRepo orderItemRepo,
            FeedbackRepo feedbackRepo,
            List<User> vets) {

        if (owners.isEmpty() || products.isEmpty()) {
            return;
        }

        Order.Status[] statuses = {
                Order.Status.DELIVERED,
                Order.Status.SHIPPED,
                Order.Status.PAID,
                Order.Status.CREATED
        };

        int orderCount = 0;
        for (int i = 0; i < 8 && i < owners.size() * 2; i++) {
            User owner = owners.get(i % owners.size());
            int productIndex = (i * 3) % products.size();

            Order order = new Order();
            order.setUser(owner);
            order.setStatus(statuses[i % statuses.length]);
            order.setCreatedAt(LocalDateTime.now().minusDays(7 - i));

            OrderItem item1 = new OrderItem();
            item1.setProduct(products.get(productIndex % products.size()));
            item1.setQuantity(1);
            item1.setPrice(item1.getProduct().getPrice());
            
            OrderItem item2 = new OrderItem();
            item2.setProduct(products.get((productIndex + 1) % products.size()));
            item2.setQuantity(1 + (i % 2));
            item2.setPrice(item2.getProduct().getPrice());

            List<OrderItem> items = new ArrayList<>();
            items.add(item1);
            items.add(item2);

            double total = items.stream()
                    .mapToDouble(item -> item.getPrice() * item.getQuantity())
                    .sum();
            order.setTotalAmount(total);
            order.setItems(items);
            
            for (OrderItem item : items) {
                item.setOrder(order);
            }

            orderRepo.save(order);
            orderCount++;
        }

        List<Appointment> completedAppointments = appointmentRepo
                .findByUserIdAndStatusIn(owners.get(0).getId(), List.of(Appointment.Status.COMPLETED));

        for (int i = 0; i < completedAppointments.size() && i < 4; i++) {
            Appointment apt = completedAppointments.get(i);

            Feedback feedback = new Feedback();
            feedback.setAppointment(apt);
            feedback.setUser(apt.getUser());
            feedback.setVet(apt.getVet());
            feedback.setRating(4 + (i % 2));
            feedback.setComment("Excellent service! " + (i % 2 == 0 ? "Very professional." : "Pet was well cared for."));
            feedback.setWaitingTimeRating(4);
            feedback.setFacilitiesRating(5);
            feedback.setStaffFriendlinessRating(5);
            feedback.setValueForMoneyRating(4);
            feedbackRepo.save(feedback);
        }
    }
}
