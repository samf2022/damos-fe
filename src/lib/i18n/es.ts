// User-facing copy (Spanish, Venezuela). Keep every visible string here.
import type { CertificateStatus, CertificateTypeCode } from '#lib/types.ts';
import type { RequestErrorCode } from '#lib/validation/certificateRequest.ts';

export const es = {
	app: {
		name: 'Damos Fe',
		tagline: 'Constancias del consejo comunal'
	},
	nav: {
		home: 'Inicio',
		request: 'Solicitar constancia',
		admin: 'Administración'
	},
	home: {
		title: 'Solicita tu constancia',
		description:
			'Pide en línea tu constancia de residencia, de residencia y buena conducta o de buena conducta. El consejo comunal revisará tu solicitud y te avisará cuando esté lista.',
		cta: 'Comenzar solicitud'
	},
	request: {
		title: 'Solicitud de constancia',
		description: 'Completa tus datos tal como aparecen en tu cédula de identidad.',
		certificateType: 'Tipo de constancia',
		selectType: 'Selecciona un tipo',
		resident: {
			nationalId: 'Cédula de identidad',
			nationalIdHint: 'Ejemplo: V-12345678',
			firstNames: 'Nombres',
			lastNames: 'Apellidos',
			gender: 'Sexo',
			maritalStatus: 'Estado civil',
			occupation: 'Ocupación',
			streetAddress: 'Calle o avenida',
			houseNumber: 'Número o nombre de casa',
			phone: 'Teléfono (WhatsApp)',
			phoneHint: 'Ejemplo: 0412-1234567'
		},
		knownSince: 'Tiempo viviendo en la comunidad',
		knownSinceHint: 'Ejemplo: más de 20 años',
		sections: {
			type: '¿Qué constancia necesitas?',
			personal: 'Datos personales',
			address: 'Dirección y contacto'
		},
		optional: '(opcional)',
		submit: 'Enviar solicitud',
		submitting: 'Enviando…',
		noTypes: 'Por ahora no hay tipos de constancia disponibles.',
		fixErrors: 'Revisa los campos marcados en rojo.',
		duplicatePending:
			'Ya tienes una solicitud pendiente de este tipo de constancia. Espera a que el consejo comunal la revise.',
		typeUnavailable: 'Ese tipo de constancia ya no está disponible. Selecciona otro.',
		errors: {
			required: 'Este campo es obligatorio.',
			too_long: 'El texto es demasiado largo.',
			invalid_national_id: 'Escribe la cédula con su letra y números, por ejemplo V-12345678.',
			invalid_name: 'Usa solo letras, espacios, apóstrofos o guiones.',
			invalid_option: 'Selecciona una opción de la lista.',
			invalid_phone: 'Escribe un teléfono venezolano válido, por ejemplo 0412-1234567.'
		} satisfies Record<RequestErrorCode, string>
	},
	requestSent: {
		title: '¡Solicitud enviada!',
		description:
			'Recibimos tu solicitud. El consejo comunal la revisará y te contactará por WhatsApp cuando tu constancia esté lista.',
		back: 'Volver al inicio'
	},
	verify: {
		title: 'Verificación de constancia',
		notFound: 'No encontramos ninguna constancia con este código.',
		holder: 'Titular',
		type: 'Tipo',
		status: 'Estado',
		issuedAt: 'Emitida el',
		expiresAt: 'Vigente hasta',
		valid: 'Constancia válida y vigente',
		expired: 'Constancia vencida',
		notIssued: 'Esta constancia no ha sido emitida'
	},
	gender: {
		F: 'Femenino',
		M: 'Masculino'
	},
	maritalStatus: {
		single: 'Soltero(a)',
		married: 'Casado(a)',
		divorced: 'Divorciado(a)',
		widowed: 'Viudo(a)',
		cohabiting: 'Unión estable de hecho'
	},
	certificateType: {
		residence: 'Constancia de residencia',
		residence_conduct: 'Constancia de residencia y buena conducta',
		conduct: 'Constancia de buena conducta'
	} satisfies Record<CertificateTypeCode, string>,
	certificateStatus: {
		pending: 'Pendiente',
		approved: 'Aprobada',
		rejected: 'Rechazada'
	} satisfies Record<CertificateStatus, string>,
	admin: {
		title: 'Panel administrativo',
		nav: {
			dashboard: 'Inicio',
			certificates: 'Solicitudes',
			residents: 'Residentes',
			signers: 'Firmantes',
			certificateTypes: 'Tipos de constancia',
			settings: 'Datos del consejo',
			users: 'Usuarios'
		},
		dashboard: {
			title: 'Resumen',
			pending: 'Pendientes por revisar',
			approved: 'Aprobadas',
			rejected: 'Rechazadas'
		},
		certificates: {
			title: 'Solicitudes de constancias',
			detailTitle: 'Revisión de solicitud',
			empty: 'No hay solicitudes con estos filtros.',
			all: 'Todas',
			searchLabel: 'Buscar por cédula o nombre',
			searchPlaceholder: 'V-12345678 o María',
			search: 'Buscar',
			columns: {
				resident: 'Solicitante',
				type: 'Tipo',
				status: 'Estado',
				submittedAt: 'Enviada',
				serial: 'N.º'
			},
			previous: 'Anterior',
			next: 'Siguiente',
			back: '← Volver a solicitudes'
		},
		review: {
			submittedAt: 'Enviada el',
			submittedData: 'Datos enviados',
			residentRecord: 'Ficha actual',
			differs: 'Lo enviado difiere de la ficha del residente.',
			updateResident: 'Actualizar la ficha del residente con los datos enviados',
			fields: {
				nationalId: 'Cédula',
				fullName: 'Nombre completo',
				gender: 'Sexo',
				maritalStatus: 'Estado civil',
				occupation: 'Ocupación',
				address: 'Dirección',
				phone: 'Teléfono'
			},
			preview: 'Vista previa del texto',
			previewNote: 'La fecha definitiva será la del momento de aprobar.',
			missing: 'Faltan datos para completar el texto:',
			knownSince: 'Tiempo viviendo en la comunidad',
			signers: 'Firmantes',
			signersHint: 'Por defecto, los firmantes asignados a este tipo de constancia.',
			approve: 'Aprobar y emitir',
			approving: 'Aprobando…',
			reject: 'Rechazar solicitud',
			rejecting: 'Rechazando…',
			rejectReason: 'Motivo del rechazo',
			rejectReasonHint: 'Se le podrá comunicar al solicitante.',
			approvedTitle: 'Constancia emitida',
			rejectedTitle: 'Solicitud rechazada',
			serialNumber: 'Número',
			verificationCode: 'Código de verificación',
			verificationLink: 'Enlace de verificación',
			issuedAt: 'Emitida el',
			expiresAt: 'Vence el',
			reviewedBy: 'Revisada por',
			reviewedAt: 'Revisada el',
			finalText: 'Texto emitido',
			nextSteps:
				'La generación del PDF, la impresión y el envío por WhatsApp llegan en el próximo paso.',
			errors: {
				not_found: 'La solicitud no existe.',
				already_reviewed: 'Esta solicitud ya fue revisada por otra persona. Recarga la página.',
				no_signers: 'Selecciona al menos un firmante.',
				no_council: 'Faltan los datos del consejo comunal. Complétalos en «Datos del consejo».',
				template_incomplete: 'Faltan datos para completar el texto de la constancia.',
				reason_required: 'Escribe el motivo del rechazo (al menos 5 caracteres).',
				known_since_required: 'Indica el tiempo viviendo en la comunidad.'
			}
		},
		residents: { title: 'Residentes' },
		signers: { title: 'Firmantes' },
		certificateTypes: { title: 'Tipos de constancia' },
		settings: { title: 'Datos del consejo comunal' },
		users: { title: 'Usuarios administradores' },
		placeholder: 'Esta sección se construirá en el próximo hito.',
		signedInAs: 'Sesión iniciada como',
		logout: 'Cerrar sesión'
	},
	login: {
		title: 'Iniciar sesión',
		username: 'Usuario',
		password: 'Contraseña',
		submit: 'Entrar',
		invalidCredentials: 'Usuario o contraseña incorrectos.',
		missingFields: 'Ingresa tu usuario y contraseña.'
	},
	errors: {
		notFound: 'Página no encontrada',
		forbidden: 'No tienes permiso para ver esta página.',
		unauthorized: 'Debes iniciar sesión.',
		generic: 'Ocurrió un error inesperado. Intenta de nuevo.',
		backHome: 'Volver al inicio'
	}
} as const;
