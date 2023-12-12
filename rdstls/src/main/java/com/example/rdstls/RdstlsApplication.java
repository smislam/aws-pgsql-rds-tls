package com.example.rdstls;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories
public class RdstlsApplication {

	public static void main(String[] args) {
		SpringApplication.run(RdstlsApplication.class, args);
	}

	@Bean
	public CommandLineRunner initDb(CustomerRepository repository) {
		return (args) -> {
			repository.save(new Customer(1L, "Shafiq", "email@nowhere.com"));
		};
	}

}
