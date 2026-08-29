# ===========================================================================
#  Compilación del manual de usuario.
#
#    make          -> genera manual.pdf
#    make watch    -> recompila automáticamente al guardar
#    make clean    -> borra archivos intermedios, conserva el PDF
#    make cleanall -> borra también el PDF
# ===========================================================================

PRINCIPAL = manual

.PHONY: all watch clean cleanall

all:
	latexmk -pdf -interaction=nonstopmode -halt-on-error $(PRINCIPAL).tex

watch:
	latexmk -pdf -pvc -interaction=nonstopmode $(PRINCIPAL).tex

clean:
	latexmk -c

cleanall:
	latexmk -C
