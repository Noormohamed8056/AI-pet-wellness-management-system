package com.jeeva.petcare.controller;

import com.jeeva.petcare.model.*;
import com.jeeva.petcare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ChatbotController {

    private final UserRepo userRepo;
    private final PetRepo petRepo;
    private final AppointmentRepo appointmentRepo;
    private final VetProfileRepo vetProfileRepo;
    private final PrescriptionRepo prescriptionRepo;
    private final VaccinationRepository vaccinationRepo;
    private final MedicalRecordRepo medicalRecordRepo;
    
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${openrouter.api.key}")
    private String apiKey;


    // ==================== MAIN CHAT ENDPOINT ====================
    @PostMapping("/ask")
    public ResponseEntity<?> askQuestion(@RequestBody Map<String, Object> request) {
        try {
            String message = (String) request.get("message");
            Long userId = request.get("userId") != null ? Long.valueOf(request.get("userId").toString()) : null;
            Long petId = request.get("petId") != null ? Long.valueOf(request.get("petId").toString()) : null;
            
            // Get user context
            Map<String, Object> context = getUserContext(userId, petId);
            
            // Generate response based on question type
            String responseMessage = generateResponse(message, context);
            
            // Generate suggestions
            List<String> suggestions = generateSuggestions(context);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", responseMessage);
            response.put("timestamp", System.currentTimeMillis());
            response.put("suggestions", suggestions);
            response.put("context", context);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Sorry, I'm having trouble processing your request. Please try again.");
            error.put("details", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // ==================== USER CONTEXT BUILDER ====================
    private Map<String, Object> getUserContext(Long userId, Long petId) {
        Map<String, Object> context = new HashMap<>();
        
        // Platform Stats (Always available)
        context.put("totalVets", userRepo.countByRoleAndApproved(User.Role.VET, true));
        context.put("totalPets", petRepo.countTotalPets());
        context.put("totalUsers", userRepo.countTotalUsers());
        context.put("totalAppointments", appointmentRepo.countTotalAppointments());
        context.put("totalPrescriptions", prescriptionRepo.countTotalPrescriptions());
        context.put("totalVaccinations", vaccinationRepo.countTotalVaccinations());
        
        // Platform Info
        context.put("platformName", "PetCare");
        context.put("platformDescription", "A comprehensive veterinary platform connecting pet owners with qualified veterinarians");
        context.put("features", Arrays.asList(
            "Book appointments with veterinarians",
            "Track pet health metrics",
            "Manage prescriptions and vaccinations",
            "Shop for pet products",
            "Consult with veterinary professionals"
        ));
        
        if (userId == null) {
            context.put("isLoggedIn", false);
            context.put("userRole", "GUEST");
            return context;
        }
        
        // Logged in user context
        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) {
            context.put("isLoggedIn", false);
            return context;
        }
        
        User user = userOpt.get();
        context.put("isLoggedIn", true);
        context.put("userId", user.getId());
        context.put("userName", user.getName());
        context.put("userEmail", user.getEmail());
        context.put("userRole", user.getRole().toString());
        context.put("userApproved", user.isApproved());
        context.put("memberSince", user.getCreatedAt() != null ? 
            user.getCreatedAt().format(DateTimeFormatter.ofPattern("MMMM yyyy")) : "Recently");
        
        // ========== PET OWNER SPECIFIC DATA ==========
        if (user.getRole() == User.Role.OWNER) {
            // User's pets
            List<Pet> userPets = petRepo.findByOwnerIdOrderByNameAsc(userId);
            context.put("myPetsCount", userPets.size());
            context.put("myPets", userPets.stream()
                .map(p -> {
                    Map<String, Object> petMap = new HashMap<>();
                    petMap.put("id", p.getId());
                    petMap.put("name", p.getName());
                    petMap.put("species", p.getSpecies());
                    petMap.put("breed", p.getBreed() != null ? p.getBreed() : "Unknown");
                    petMap.put("age", p.getAge() != null ? p.getAge() : 0);
                    petMap.put("gender", p.getGender() != null ? p.getGender() : "Unknown");
                    
                    // Get pet's vaccination count
                    long vaxCount = vaccinationRepo.countByPetId(p.getId());
                    petMap.put("vaccinations", vaxCount);
                    
                    // Get pet's prescription count
                    long prescriptionCount = prescriptionRepo.countByPetId(p.getId());
                    petMap.put("prescriptions", prescriptionCount);
                    
                    
                    return petMap;
                })
                .collect(Collectors.toList()));
            
            // User's appointments
            List<Appointment.Status> upcomingStatuses = Arrays.asList(
                Appointment.Status.BOOKED, 
                Appointment.Status.APPROVED, 
                Appointment.Status.PAID
            );
            
            List<Appointment> upcomingAppointments = appointmentRepo.findUserUpcomingAppointments(userId, upcomingStatuses);
            
            context.put("myUpcomingAppointmentsCount", upcomingAppointments.size());
            
            context.put("myUpcomingAppointments", upcomingAppointments.stream()
                .limit(3)
                .map(a -> {
                    Map<String, Object> aptMap = new HashMap<>();
                    aptMap.put("id", a.getId());
                    aptMap.put("date", a.getSlot().getSlotDate().toString());
                    aptMap.put("time", a.getSlot().getStartTime().toString());
                    aptMap.put("vetName", a.getVet().getName());
                    aptMap.put("petName", a.getPet().getName());
                    aptMap.put("status", a.getStatus().toString());
                    return aptMap;
                })
                .collect(Collectors.toList()));
        }
        
        // ========== VET SPECIFIC DATA ==========
        if (user.getRole() == User.Role.VET) {
            // Vet profile
            Optional<VetProfile> vetProfile = vetProfileRepo.findByUserId(userId);
            vetProfile.ifPresent(profile -> {
                context.put("vetQualification", profile.getQualification());
                context.put("vetSpecialization", profile.getSpecialization());
                context.put("vetHospital", profile.getHospitalName());
                context.put("vetExperience", profile.getExperienceYears());
                context.put("vetLicense", profile.getLicenseNumber());
                context.put("vetFee", profile.getConsultationFee());
            });
            
            // Vet's patients
            List<Pet> vetPatients = petRepo.findDistinctByAppointmentsVetId(userId);
            context.put("myPatientsCount", vetPatients.size());
            context.put("myPatients", vetPatients.stream()
                .limit(5)
                .map(p -> Map.of(
                    "id", p.getId(),
                    "name", p.getName(),
                    "species", p.getSpecies(),
                    "owner", p.getOwner().getName()
                ))
                .collect(Collectors.toList()));
            
            // Vet's appointments
            List<Appointment.Status> upcomingStatuses = Arrays.asList(
                Appointment.Status.BOOKED, 
                Appointment.Status.APPROVED, 
                Appointment.Status.PAID
            );
            
            List<Appointment> vetUpcoming = appointmentRepo.findVetUpcomingAppointments(userId, upcomingStatuses);
            
            context.put("myVetUpcomingCount", vetUpcoming.size());
            
            // Vet's prescriptions
            long vetPrescriptions = prescriptionRepo.countByVetId(userId);
            context.put("myPrescriptionsCount", vetPrescriptions);
            
            // Vet's vaccinations
            long vetVaccinations = vaccinationRepo.countByVetId(userId);
            context.put("myVaccinationsCount", vetVaccinations);
        }
        
        // ========== SPECIFIC PET DETAILS ==========
        if (petId != null) {
            petRepo.findById(petId).ifPresent(pet -> {
                Map<String, Object> petDetails = new HashMap<>();
                petDetails.put("id", pet.getId());
                petDetails.put("name", pet.getName());
                petDetails.put("species", pet.getSpecies());
                petDetails.put("breed", pet.getBreed());
                petDetails.put("age", pet.getAge());
                petDetails.put("gender", pet.getGender());
                
                // Pet medical history
                List<MedicalRecord> medicalRecords = medicalRecordRepo.findByPetId(petId);
                petDetails.put("medicalRecordsCount", medicalRecords.size());
                
                // Pet vaccinations
                List<Vaccination> vaccinations = vaccinationRepo.findByPetId(petId);
                petDetails.put("vaccinations", vaccinations.stream()
                    .map(v -> Map.of(
                        "name", v.getName(),
                        "date", v.getDate().toString(),
                        "nextDue", v.getNextDueDate().toString(),
                        "status", v.getStatus().toString()
                    ))
                    .collect(Collectors.toList()));
                
                // Pet prescriptions
                List<Prescription> prescriptions = prescriptionRepo.findByMedicalRecordPetId(petId);
                petDetails.put("prescriptionsCount", prescriptions.size());
                
                // Pet appointments
                long petAppointments = appointmentRepo.countByPet_Id(petId);
                petDetails.put("appointmentsCount", petAppointments);
                
                context.put("selectedPet", petDetails);
            });
        }
        
        return context;
    }

    // ==================== RESPONSE GENERATOR ====================
    private String generateResponse(String message, Map<String, Object> context) {
        String lowerMsg = message.toLowerCase().trim();
        boolean isLoggedIn = (boolean) context.getOrDefault("isLoggedIn", false);
        String userRole = (String) context.getOrDefault("userRole", "GUEST");
        
        // ===== GREETINGS =====
        if (lowerMsg.matches(".*\\b(hi|hello|hey|greetings|howdy|sup)\\b.*")) {
            if (isLoggedIn) {
                String name = (String) context.get("userName");
                return String.format("👋 **Hello %s!** Welcome back to PetCare!\n\nHow can I assist you with your furry friends today? 🐾", 
                    name != null ? name.split(" ")[0] : "there");
            } else {
                return "👋 **Hello there!** Welcome to PetCare!\n\nI'm your virtual veterinary assistant. I can help you with:\n\n" +
                       "• 🏥 Finding veterinarians\n" +
                       "• 📅 Booking appointments\n" +
                       "• 🩺 Pet health information\n" +
                       "• 🛍️ Pet shop products\n\n" +
                       "✨ **Tip:** Login to get personalized information about your pets!";
            }
        }
        
        // ===== THANK YOU =====
        if (lowerMsg.matches(".*\\b(thanks?|thank you|appreciate|grateful)\\b.*")) {
            return "😊 You're very welcome! I'm always here to help you and your pets.\n\n" +
                   "Is there anything else you'd like to know? 🐕🐈";
        }
        
        // ===== PLATFORM INFORMATION =====
        if (lowerMsg.contains("what is petcare") || lowerMsg.contains("about petcare") || 
            lowerMsg.contains("about this app") || lowerMsg.contains("what can you do")) {
            return """
                🏥 **About PetCare Platform**
                
                PetCare is a comprehensive **veterinary ecosystem** designed to make pet healthcare accessible and convenient!
                
                ✨ **What we offer:**
                
                🩺 **Veterinary Consultations**
                • Book appointments with qualified vets
                • Online and in-clinic consultations
                • Specialized veterinary care
                
                📊 **Pet Health Management**
                • Track health metrics daily
                • Vaccination reminders
                • Prescription management
                • Medical history tracking
                
                🛍️ **Pet Shop**
                • Quality pet food and treats
                • Toys and accessories
                • Medicines and supplements
                
                👨‍⚕️ **For Veterinarians**
                • Manage your practice
                • Digital medical records
                • Prescription builder
                • Appointment calendar
                
                🎯 **Our Mission**
                To provide every pet with access to quality healthcare and every pet parent with peace of mind.
                
                How can I help you get started? 🐾
                """;
        }
        
        // ===== STATISTICS QUESTIONS =====
        if (lowerMsg.contains("how many") || lowerMsg.contains("total") || lowerMsg.contains("count")) {
            return generateStatsResponse(message, context);
        }
        
        // ===== LOGIN REQUIRED AREA =====
        if (!isLoggedIn) {
            if (lowerMsg.contains("my pet") || lowerMsg.contains("my appointment") || 
                lowerMsg.contains("my vet") || lowerMsg.contains("i have")) {
                return """
                    🔐 **Login Required**
                    
                    To access your personal pet information, appointments, and veterinary history, please **login to your account**.
                    
                    👉 **New to PetCare?** Register now - it's free!
                    
                    Once logged in, I can help you with:
                    • 📋 Viewing your registered pets
                    • 📅 Checking upcoming appointments
                    • 💊 Tracking prescriptions
                    • 💉 Vaccination schedules
                    
                    Would you like me to guide you to the login page? 🔑
                    """;
            }
        }
        
        // ===== LOGGED IN USER - PERSONALIZED RESPONSES =====
      if (isLoggedIn) {
            String roleResponse = null;

            if (userRole.equals("OWNER")) {
                roleResponse = generateOwnerResponse(message, context);
            } else if (userRole.equals("VET")) {
                roleResponse = generateVetResponse(message, context);
            } else if (userRole.equals("ADMIN")) {
                roleResponse = generateAdminResponse(message, context);
            }

            if (roleResponse != null) {
                return roleResponse;
            }
        }

        
        // ===== APPOINTMENT QUESTIONS =====
        if (lowerMsg.contains("appointment") || lowerMsg.contains("book") || lowerMsg.contains("schedule")) {
            return generateAppointmentHelp(context);
        }
        
        // ===== VET/FIND DOCTOR QUESTIONS =====
        if (lowerMsg.contains("vet") || lowerMsg.contains("doctor") || lowerMsg.contains("veterinarian") || 
            lowerMsg.contains("specialist") || lowerMsg.contains("find")) {
            return generateVetHelp(context);
        }
        
        // ===== PET/SHOPPING QUESTIONS =====
        if (lowerMsg.contains("pet shop") || lowerMsg.contains("buy") || lowerMsg.contains("product") || 
            lowerMsg.contains("food") || lowerMsg.contains("toy") || lowerMsg.contains("accessories")) {
            return """
                🛍️ **Pet Shop**
                
                Our Pet Shop offers a wide range of products for your furry friends!
                
                🦴 **Food & Treats**
                • Premium pet food brands
                • Special diet options
                • Natural treats
                
                🧸 **Toys & Accessories**
                • Interactive toys
                • Comfort items
                • Leashes and collars
                
                💊 **Health Products**
                • Supplements
                • Flea & tick prevention
                • First aid supplies
                
                👉 **Browse our shop** to find everything your pet needs!
                
                Would you like to know more about any specific category? 🐾
                """;
        }
        
        // ===== VACCINATION QUESTIONS =====
        if (lowerMsg.contains("vaccine") || lowerMsg.contains("vaccination") || lowerMsg.contains("shot") || 
            lowerMsg.contains("due") || lowerMsg.contains("vaccinate")) {
            return generateVaccinationHelp(context);
        }
        
        // ===== PRESCRIPTION QUESTIONS =====
        if (lowerMsg.contains("prescription") || lowerMsg.contains("medicine") || lowerMsg.contains("medication")) {
            return generatePrescriptionHelp(context);
        }
        
        // ===== FALLBACK - TRY OPENROUTER AI =====
        String aiResponse = callOpenRouter(message, context);
        if (aiResponse != null && !aiResponse.isEmpty()) {
            return aiResponse;
        }
        
        // ===== ULTIMATE FALLBACK =====
        return generateGeneralHelp(context);
    }

    // ==================== STATS RESPONSE ====================
    private String generateStatsResponse(String message, Map<String, Object> context) {
        String lower = message.toLowerCase();
        long totalVets = (long) context.get("totalVets");
        long totalPets = (long) context.get("totalPets");
        long totalUsers = (long) context.get("totalUsers");
        long totalAppointments = (long) context.get("totalAppointments");
        
        if (lower.contains("vet") || lower.contains("doctor")) {
            return String.format("""
                👨‍⚕️ **Veterinarians on PetCare: %d**
                
                Our veterinary community includes specialists in:
                • 🐕 Canine Medicine
                • 🐈 Feline Medicine
                • 🐇 Exotic Pets
                • 🦴 Orthopedics
                • 🦷 Dentistry
                • 💉 Preventive Care
                
                All our vets are licensed and verified professionals.
                
                Would you like to book an appointment with one of our vets? 🏥
                """, totalVets);
        }
        
        if (lower.contains("pet")) {
            return String.format("""
                🐾 **Registered Pets on PetCare: %d**
                
                Our furry family members include:
                • 🐕 Dogs: The most popular!
                • 🐈 Cats: Close second
                • 🐇 Rabbits
                • 🦜 Birds
                • 🐠 Fish
                • 🐹 Hamsters & more!
                
                Every pet gets personalized healthcare through our platform.
                
                Do you have a pet registered with us? 🐶🐱
                """, totalPets);
        }
        
        if (lower.contains("user") || lower.contains("owner")) {
            return String.format("""
                👤 **PetCare Community: %d Users**
                
                Our community consists of:
                • 🐕 Pet Owners: %d
                • 👨‍⚕️ Veterinarians: %d
                • 👑 Administrators
                
                We're growing every day! Join our pet-loving community today! 🎉
                """, totalUsers, totalUsers - userRepo.countByRole(User.Role.VET), totalVets);
        }
        
        if (lower.contains("appointment")) {
            return String.format("""
                📅 **Total Appointments Booked: %d**
                
                📊 **Quick Stats:**
                • ✅ Completed: %d
                • 🔜 Upcoming: %d
                • 📍 Today: %d
                
                PetCare has facilitated thousands of successful veterinary consultations!
                
                Ready to book your pet's next checkup? 🏥
                """, 
                totalAppointments,
                appointmentRepo.countCompletedAppointments(),
                appointmentRepo.countTodayAppointments());
        }
        
        return String.format("""
            📊 **PetCare Platform Statistics**
            
            👨‍⚕️ **Veterinarians:** %d
            🐕 **Total Pets:** %d
            👤 **Users:** %d
            📅 **Appointments:** %d
            💊 **Prescriptions:** %d
            💉 **Vaccinations:** %d
            
            We're proud to serve the pet community! 🎉
            """,
            totalVets,
            totalPets,
            totalUsers,
            totalAppointments,
            context.get("totalPrescriptions"),
            context.get("totalVaccinations"));
    }


        private long getLong(Map<String, Object> context, String key) {
        Object value = context.get(key);
        if (value == null) return 0L;
        return ((Number) value).longValue();
    }

    // ==================== OWNER RESPONSES ====================
    private String generateOwnerResponse(String message, Map<String, Object> context) {
        String lower = message.toLowerCase();
        long myPetsCount = getLong(context, "myPetsCount");
        long myAppointmentsCount = getLong(context, "myAppointmentsCount");
        long myUpcomingCount = getLong(context, "myUpcomingAppointmentsCount");
        
        // My pets
        if (lower.contains("my pet") || (lower.contains("pet") && lower.contains("i have"))) {
            if (myPetsCount == 0) {
                return """
                    🐾 **You don't have any registered pets yet!**
                    
                    Let's fix that right away! ✨
                    
                    📝 **To add your pet:**
                    1️⃣ Go to **Dashboard**
                    2️⃣ Click **"Add New Pet"**
                    3️⃣ Enter your pet's details
                    4️⃣ Upload a cute photo! 📸
                    
                    Would you like me to guide you through the process? 🐶🐱
                    """;
            }
            
            List<Map<String, Object>> pets = (List<Map<String, Object>>) context.get("myPets");
            StringBuilder petList = new StringBuilder();
            petList.append(String.format("🐾 **You have %d wonderful pet%s!**\n\n", 
                myPetsCount, myPetsCount > 1 ? "s" : ""));
            
            for (Map<String, Object> pet : pets) {
                petList.append(String.format("**%s** the %s\n", 
                    pet.get("name"), 
                    pet.get("species")));
                petList.append(String.format("  • 🎂 Age: %s years\n", pet.get("age")));
                petList.append(String.format("  • 💉 Vaccinations: %s\n", pet.get("vaccinations")));
                petList.append(String.format("  • 📅 Last Visit: %s\n\n", pet.get("lastVisit")));
            }
            
            petList.append("Would you like to know more about any specific pet? 🥰");
            
            return petList.toString();
        }
        
        // My appointments
        if (lower.contains("my appointment")) {
            if (myAppointmentsCount == 0) {
                return """
                    📅 **You haven't booked any appointments yet!**
                    
                    Your pet deserves the best care! 🌟
                    
                    🏥 **Book an appointment:**
                    1️⃣ Browse available vets
                    2️⃣ Choose a convenient time
                    3️⃣ Confirm booking
                    
                    Ready to schedule your first appointment? 🗓️
                    """;
            }
            
            if (myUpcomingCount > 0) {
                List<Map<String, Object>> upcoming = (List<Map<String, Object>>) context.get("myUpcomingAppointments");
                StringBuilder aptList = new StringBuilder();
                aptList.append(String.format("📅 **You have %d upcoming appointment%s!**\n\n", 
                    myUpcomingCount, myUpcomingCount > 1 ? "s" : ""));
                
                for (Map<String, Object> apt : upcoming) {
                    aptList.append(String.format("**%s** with Dr. %s\n", 
                        apt.get("petName"), 
                        apt.get("vetName")));
                    aptList.append(String.format("  • 📆 Date: %s\n", apt.get("date")));
                    aptList.append(String.format("  • ⏰ Time: %s\n", apt.get("time")));
                    aptList.append(String.format("  • Status: %s\n\n", 
                        getStatusEmoji((String) apt.get("status")) + " " + apt.get("status")));
                }
                
                return aptList.toString();
            } else {
                return """
                    📅 **You have no upcoming appointments**
                    
                    Don't forget regular checkups are important for your pet's health! 🏥
                    
                    Would you like to browse available veterinarians? 👨‍⚕️
                    """;
            }
        }
        
        return null;
    }

    // ==================== VET RESPONSES ====================
    private String generateVetResponse(String message, Map<String, Object> context) {
        String lower = message.toLowerCase();
        long patientsCount = getLong(context, "myPatientsCount");
        long upcomingCount = getLong(context, "myVetUpcomingCount");
        
        if (lower.contains("my patient")) {
            if (patientsCount == 0) {
                return """
                    🏥 **You don't have any patients yet**
                    
                    Once pet owners book appointments with you, they'll appear here!
                    
                    📝 **Tips to get more patients:**
                    • Complete your profile fully
                    • Add your specialization
                    • Set your consultation fee
                    • Create available time slots
                    
                    Need help setting up your practice? 👨‍⚕️
                    """;
            }
            
            List<Map<String, Object>> patients = (List<Map<String, Object>>) context.getOrDefault("myPatients", new ArrayList<>());
            StringBuilder patientList = new StringBuilder();
            patientList.append(String.format("🏥 **You have %d patient%s** under your care\n\n", 
                patientsCount, patientsCount > 1 ? "s" : ""));
            
            for (Map<String, Object> patient : patients) {
                patientList.append(String.format("• **%s** (%s) - Owner: %s\n", 
                    patient.get("name"),
                    patient.get("species"),
                    patient.get("owner")));
            }
            
            return patientList.toString();
        }
        
        if (lower.contains("my schedule") || lower.contains("my appointment")) {
            if (upcomingCount == 0) {
                return """
                    📅 **You have no upcoming appointments today**
                    
                    This is a great time to:
                    • ✅ Update your available slots
                    • 📝 Review patient records
                    • 🎓 Check continuing education
                    
                    Would you like to create new appointment slots? 🗓️
                    """;
            }
            
            return String.format("""
                📅 **Your Schedule**
                
                • 🔜 Upcoming: %d appointments
                • ✅ Completed: %d appointments
                • 💊 Prescriptions written: %d
                • 💉 Vaccinations given: %d
                
                Check your dashboard for detailed schedule! 📋
                """,
                upcomingCount,
                context.getOrDefault("myVetCompletedCount", 0L),
                context.getOrDefault("myPrescriptionsCount", 0L),
                context.getOrDefault("myVaccinationsCount", 0L));
        }
        
        return null;
    }

    // ==================== ADMIN RESPONSES ====================
    private String generateAdminResponse(String message, Map<String, Object> context) {
        return String.format("""
            👑 **Admin Dashboard Summary**
            
            📊 **Platform Overview:**
            • 👨‍⚕️ Total Vets: %d
            • 🐕 Total Pets: %d
            • 👤 Total Users: %d
            • 📅 Appointments: %d
            • ⏳ Pending Vets: %d
            
            How can I assist with platform management today?
            """,
            context.get("totalVets"),
            context.get("totalPets"),
            context.get("totalUsers"),
            context.get("totalAppointments"),
            userRepo.countByRoleAndApprovedFalse(User.Role.VET));
    }

    // ==================== APPOINTMENT HELP ====================
    private String generateAppointmentHelp(Map<String, Object> context) {
        boolean isLoggedIn = (boolean) context.getOrDefault("isLoggedIn", false);
        
        if (!isLoggedIn) {
            return """
                📅 **Booking an Appointment**
                
                Here's how to book a veterinary appointment:
                
                1️⃣ **Login** to your PetCare account
                2️⃣ Go to **Find a Vet**
                3️⃣ Browse available veterinarians
                4️⃣ Select a date and time
                5️⃣ Choose your pet
                6️⃣ Confirm booking!
                
                💡 **Pro tip:** You can also book appointments directly from a vet's profile page!
                
                Would you like to login now? 🔐
                """;
        }
        
        long myPetsCount = getLong(context, "myPetsCount");
        
        if (myPetsCount == 0) {
            return """
                📝 **Before Booking an Appointment**
                
                You need to **register your pet first**! Here's how:
                
                1️⃣ Go to **Dashboard**
                2️⃣ Click **"Add New Pet"**
                3️⃣ Fill in your pet's details
                4️⃣ Upload a photo 📸
                
                Once your pet is registered, you can book appointments instantly!
                
                Shall I guide you to add your pet? 🐾
                """;
        }
        
        return """
            📅 **Ready to Book an Appointment?**
            
            Here's what you need to do:
            
            1️⃣ **Browse Vets**: Find a veterinarian near you
            2️⃣ **Check Availability**: View their available slots
            3️⃣ **Select Pet**: Choose which pet needs the visit
            4️⃣ **Confirm**: Book and make payment
            
            🎯 **Quick Links:**
            • 👨‍⚕️ Find a Vet
            • 📋 My Pets
            • 📅 My Appointments
            
            Would you like me to help you find a vet? 🏥
            """;
    }

    // ==================== VET HELP ====================
    private String generateVetHelp(Map<String, Object> context) {
        long totalVets = getLong(context, "totalVets");
        
        return String.format("""
            👨‍⚕️ **Find a Veterinarian**
            
            We have **%d qualified veterinarians** on PetCare!
            
            🔍 **How to find the right vet:**
            
            1️⃣ **Filter by Specialization**
               • General Practice
               • Surgery
               • Dentistry
               • Dermatology
               • Cardiology
               • Exotic Pets
               
            2️⃣ **Check Availability**
               • View real-time slots
               • Choose convenient time
               • Online or in-clinic
               
            3️⃣ **Read Reviews**
               • See what other pet parents say
               • Check ratings
               • Compare experience
            
            Ready to book an appointment? 📅
            """, totalVets);
    }

    // ==================== VACCINATION HELP ====================
    private String generateVaccinationHelp(Map<String, Object> context) {
        boolean isLoggedIn = (boolean) context.getOrDefault("isLoggedIn", false);
        
        if (!isLoggedIn) {
            return """
                💉 **Pet Vaccinations**
                
                Keeping your pet up-to-date with vaccinations is crucial for their health!
                
                **Core Vaccines:**
                • 🐕 Dogs: Rabies, Distemper, Parvo
                • 🐈 Cats: Rabies, FVRCP
                
                **Why vaccinate?**
                ✅ Prevents deadly diseases
                ✅ Required for boarding
                ✅ Protects other pets
                ✅ Peace of mind
                
                Login to track your pet's vaccination schedule! 🔐
                """;
        }
        
        return """
            💉 **Vaccination Management**
            
            PetCare helps you track all your pet's vaccinations!
            
            📋 **Features:**
            • View vaccination history
            • Get due date reminders
            • Download vaccination certificates
            • Schedule booster shots
            
            📍 **Next Steps:**
            1️⃣ Visit your pet's profile
            2️⃣ Check the Vaccinations tab
            3️⃣ Book appointment for due vaccines
            
            Need help scheduling a vaccination? 🏥
            """;
    }

    // ==================== PRESCRIPTION HELP ====================
    private String generatePrescriptionHelp(Map<String, Object> context) {
        return """
            💊 **Prescriptions on PetCare**
            
            Managing your pet's medications is easy with PetCare!
            
            📱 **Digital Prescriptions:**
            • View all active prescriptions
            • Check dosage instructions
            • Request refills
            • Download prescription history
            
            🏪 **Pharmacy Integration:**
            • Order medications directly
            • Home delivery available
            • Automatic refill reminders
            
            Questions about a specific prescription? 📝
            """;
    }

    // ==================== GENERAL HELP ====================
    private String generateGeneralHelp(Map<String, Object> context) {
        boolean isLoggedIn = (boolean) context.getOrDefault("isLoggedIn", false);
        
        String help = """
            🤔 **How can I help you today?**
            
            Here are some things I can assist with:
            
            🏥 **Veterinary Services**
            • "Find a vet near me"
            • "Book an appointment"
            • "How to consult a vet?"
            
            🐾 **Pet Management**
            • "Add my pet"
            • "My pet's health records"
            • "Vaccination schedule"
            
            📊 **Information**
            • "How many vets are there?"
            • "Platform statistics"
            • "About PetCare"
            
            🛍️ **Pet Shop**
            • "Browse products"
            • "Order food"
            • "Pet accessories"
            
            What would you like to know more about? 💭
            """;
            
        if (!isLoggedIn) {
            help += "\n\n🔐 **Tip:** Login to get personalized information about your pets and appointments!";
        }
        
        return help;
    }

    // ==================== OPENROUTER AI CALL ====================
    private String callOpenRouter(String message, Map<String, Object> context) {

        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("sk-or-v1-")) {
            return null;
        }
        
        try {
            String systemPrompt = buildSystemPrompt(context);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "openai/gpt-4o-mini");
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 500);
            
            List<Map<String, String>> messages = new ArrayList<>();
            
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);
            messages.add(systemMsg);
            
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", message);
            messages.add(userMsg);
            
            requestBody.put("messages", messages);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "http://localhost:8080");
            headers.set("X-Title", "PetCare Veterinary Assistant");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://openrouter.ai/api/v1/chat/completions",
                entity,
                Map.class
            );

            if (response.getBody() != null && response.getBody().containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, String> messageResponse = (Map<String, String>) choice.get("message");
                    return messageResponse.get("content");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }

    // ==================== SYSTEM PROMPT BUILDER ====================
    private String buildSystemPrompt(Map<String, Object> context) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are **PetCare Assistant**, an AI-powered veterinary platform chatbot. ");
        prompt.append("Be warm, empathetic, and professional. Use emojis occasionally. Keep responses under 200 words.\n\n");
        
        prompt.append("=== PLATFORM INFORMATION ===\n");
        prompt.append("PetCare is a comprehensive veterinary platform connecting pet owners with qualified veterinarians.\n");
        prompt.append(String.format("Total Vets: %d\n", context.get("totalVets")));
        prompt.append(String.format("Total Pets: %d\n", context.get("totalPets")));
        prompt.append(String.format("Total Users: %d\n\n", context.get("totalUsers")));
        
        prompt.append("=== SERVICES ===\n");
        prompt.append("- Appointment Booking: Pet owners can book appointments with vets\n");
        prompt.append("- Pet Health Tracking: Monitor pet health metrics\n");
        prompt.append("- Prescriptions: Digital prescription management\n");
        prompt.append("- Vaccinations: Track and schedule vaccinations\n");
        prompt.append("- Pet Shop: Buy pet products\n\n");
        
        if ((boolean) context.getOrDefault("isLoggedIn", false)) {
            prompt.append("=== USER CONTEXT ===\n");
            prompt.append(String.format("User: %s\n", context.get("userName")));
            prompt.append(String.format("Role: %s\n", context.get("userRole")));
            prompt.append(String.format("Pets: %d\n", context.getOrDefault("myPetsCount", 0L)));
            prompt.append(String.format("Appointments: %d\n\n", context.getOrDefault("myAppointmentsCount", 0L)));
        }
        
        prompt.append("=== RESPONSE GUIDELINES ===\n");
        prompt.append("1. Be helpful, concise, and friendly\n");
        prompt.append("2. Use emojis appropriately (🐾 🐕 🐈 🏥 👨‍⚕️)\n");
        prompt.append("3. If user asks about personal data, guide them to login\n");
        prompt.append("4. Always provide actionable next steps\n");
        prompt.append("5. Never invent fake data - use provided context\n");
        
        return prompt.toString();
    }

    // ==================== SUGGESTIONS GENERATOR ====================
    private List<String> generateSuggestions(Map<String, Object> context) {
        List<String> suggestions = new ArrayList<>();
        boolean isLoggedIn = (boolean) context.getOrDefault("isLoggedIn", false);
        String userRole = (String) context.getOrDefault("userRole", "GUEST");
        
        if (!isLoggedIn) {
            suggestions.add("👋 Hello");
            suggestions.add("👨‍⚕️ How many vets?");
            suggestions.add("📅 Book appointment");
            suggestions.add("🐾 About PetCare");
        } else if (userRole.equals("OWNER")) {
            long myPetsCount = getLong(context, "myPetsCount");
            long myUpcomingCount = getLong(context, "myUpcomingAppointmentsCount");
            
            if (myPetsCount == 0) {
                suggestions.add("📝 Add my pet");
            } else {
                suggestions.add("🐕 My pets");
            }
            
            if (myUpcomingCount > 0) {
                suggestions.add("📅 My appointments");
            } else {
                suggestions.add("📅 Book appointment");
            }
            
            suggestions.add("💉 Vaccinations");
            suggestions.add("🛍️ Pet shop");
        } else if (userRole.equals("VET")) {
            suggestions.add("🏥 My patients");
            suggestions.add("📅 My schedule");
            suggestions.add("💊 Prescriptions");
            suggestions.add("📊 Today's appointments");
        } else if (userRole.equals("ADMIN")) {
            suggestions.add("📊 Platform stats");
            suggestions.add("👨‍⚕️ Pending vets");
            suggestions.add("🐕 Total pets");
            suggestions.add("📅 Appointments");
        }
        
        return suggestions.stream().distinct().limit(4).collect(Collectors.toList());
    }

    // ==================== UTILITY METHODS ====================
    private String getStatusEmoji(String status) {
        switch (status) {
            case "BOOKED": return "📌";
            case "PAID": return "💰";
            case "APPROVED": return "✅";
            case "COMPLETED": return "🎉";
            case "CANCELLED": return "❌";
            case "REJECTED": return "⛔";
            default: return "•";
        }
    }

    // ==================== ADDITIONAL ENDPOINTS ====================
    
    @GetMapping("/context/{userId}")
    public ResponseEntity<?> getUserContext(@PathVariable Long userId) {
        try {
            Map<String, Object> context = getUserContext(userId, null);
            return ResponseEntity.ok(context);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/suggestions/{userId}")
    public ResponseEntity<?> getSuggestions(@PathVariable Long userId) {
        try {
            Map<String, Object> context = getUserContext(userId, null);
            List<String> suggestions = generateSuggestions(context);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/stats/public")
    public ResponseEntity<?> getPublicStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalPets", petRepo.countTotalPets());
            stats.put("totalDoctors", userRepo.countByRoleAndApproved(User.Role.VET, true));
            stats.put("supportAvailable", "24/7");
            stats.put("totalUsers", userRepo.countTotalUsers());
            stats.put("totalAppointments", appointmentRepo.countTotalAppointments());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}