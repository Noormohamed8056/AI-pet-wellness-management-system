package com.noor.petcare.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.noor.petcare.service.AppointmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/book")
    public ResponseEntity<?> book(
            @RequestParam Long userId,
            @RequestParam Long petId,
            @RequestParam Long slotId) {

        try {
            return ResponseEntity.ok(
                    appointmentService.book(userId, petId, slotId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{appointmentId}/approve")
public ResponseEntity<?> approve(
        @PathVariable Long appointmentId,
        @RequestParam Long vetId) {

    try {
        return ResponseEntity.ok(
                appointmentService.approveAppointment(appointmentId, vetId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@PutMapping("/{appointmentId}/cancel")
public ResponseEntity<?> cancel(
        @PathVariable Long appointmentId,
        @RequestParam Long userId) {

    try {
        return ResponseEntity.ok(
                appointmentService.cancel(appointmentId, userId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@PutMapping("/{appointmentId}/reject")
public ResponseEntity<?> reject(
        @PathVariable Long appointmentId,
        @RequestParam Long vetId) {

    try {
        return ResponseEntity.ok(
                appointmentService.rejectAppointment(appointmentId, vetId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}


@PutMapping("/{appointmentId}/reschedule")
public ResponseEntity<?> reschedule(
        @PathVariable Long appointmentId,
        @RequestParam Long userId,
        @RequestParam Long newSlotId) {

    try {
        return ResponseEntity.ok(
                appointmentService.reschedule(
                        appointmentId, userId, newSlotId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@GetMapping("/user/{userId}/upcoming")
public ResponseEntity<?> getUserUpcoming(@PathVariable Long userId) {
    try {
        return ResponseEntity.ok(
                appointmentService.getUserUpcoming(userId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@GetMapping("/user/{userId}/completed")
public ResponseEntity<?> getUserCompleted(@PathVariable Long userId) {
    try {
        return ResponseEntity.ok(
                appointmentService.getUserCompleted(userId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@GetMapping("/vet/{vetId}/upcoming")
public ResponseEntity<?> getVetUpcoming(@PathVariable Long vetId) {
    try {
        return ResponseEntity.ok(
                appointmentService.getVetUpcoming(vetId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@GetMapping("/vet/{vetId}/completed")
public ResponseEntity<?> getVetCompleted(@PathVariable Long vetId) {
    try {
        return ResponseEntity.ok(
                appointmentService.getVetCompleted(vetId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@PutMapping("/{appointmentId}/complete")
public ResponseEntity<?> complete(
        @PathVariable Long appointmentId,
        @RequestParam Long vetId) {

    try {
        return ResponseEntity.ok(
                appointmentService.complete(appointmentId, vetId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
    @PutMapping("/{appointmentId}/mark-paid")
    public ResponseEntity<?> markPaid(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(appointmentService.markPaid(appointmentId));
    }

    @GetMapping("/vet/{vetId}/paid")
public ResponseEntity<?> getVetPaid(@PathVariable Long vetId) {
    try {
        return ResponseEntity.ok(
                appointmentService.getVetPaidAppointments(vetId)
        );
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
// AppointmentController
// All appointments of a completed pet
@GetMapping("/vet/{vetId}/pet/{petId}/visits")
public ResponseEntity<?> getPatientVisits(
        @PathVariable Long vetId,
        @PathVariable Long petId) {

    return ResponseEntity.ok(
        appointmentService.getCompletedVisits(vetId, petId)
    );
}
@GetMapping("/pet/{petId}/count")
public ResponseEntity<Long> getAppointmentCountByPet(@PathVariable Long petId) {
    return ResponseEntity.ok(
        appointmentService.getAppointmentCountByPet(petId)
    );
}

@GetMapping("/admin/all")
public ResponseEntity<?> getAllAppointments() {
    try {
        return ResponseEntity.ok(
                appointmentService.getAllAppointments()
        );
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
@GetMapping("/stats")
public ResponseEntity<?> getStats() {
    try {
        return ResponseEntity.ok(
                appointmentService.getStats()
        );
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@GetMapping("/range")
public ResponseEntity<?> getByDateRange(
        @RequestParam String start,
        @RequestParam String end) {

    try {
        return ResponseEntity.ok(
                appointmentService.getByDateRange(start, end)
        );
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@GetMapping("/status/{status}")
public ResponseEntity<?> getByStatus(@PathVariable String status) {
    try {
        return ResponseEntity.ok(
                appointmentService.getByStatus(status)
        );
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@GetMapping("/{id}")
public ResponseEntity<?> getById(@PathVariable Long id) {
    try {
        return ResponseEntity.ok(
                appointmentService.getById(id)
        );
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}



}