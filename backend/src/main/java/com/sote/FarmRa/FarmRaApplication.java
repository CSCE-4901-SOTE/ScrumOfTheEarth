package com.sote.FarmRa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FarmRaApplication {
	public static void main(String[] args) {
		SpringApplication.run(FarmRaApplication.class, args);
	}
}
